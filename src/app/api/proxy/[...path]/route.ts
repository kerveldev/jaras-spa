import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Local-only fallback (cuando tú estás logueado en gcloud)
 */
async function getIdTokenViaGcloud(targetSa: string, audience: string) {
  const raw = process.env.GCLOUD_PATH || "gcloud";
  const gcloud = raw.replace(/^"+|"+$/g, "");
  const gcloudQuoted = gcloud.includes(" ") ? `"${gcloud}"` : gcloud;

  const cmd =
    `${gcloudQuoted} auth print-identity-token ` +
    `--impersonate-service-account=${targetSa} ` +
    `--audiences=${audience} --include-email`;

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(cmd, {
      shell: process.platform === "win32" ? "cmd.exe" : true,
      windowsHide: true,
    });

    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("close", (code) => {
      if (code === 0) return resolve(out.trim());
      reject(new Error(`gcloud failed (${code}): ${err || out}`));
    });
  });
}

type JwtPublicClaims = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  azp?: string;
  exp?: number;
  iat?: number;
  [k: string]: unknown;
};

function decodeJwtClaims(token: string): JwtPublicClaims | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const claims = JSON.parse(json) as JwtPublicClaims;

    return {
      iss: claims.iss,
      aud: claims.aud,
      sub: claims.sub,
      email: claims.email,
      azp: claims.azp,
      exp: claims.exp,
      iat: claims.iat,
    };
  } catch {
    return null;
  }
}

type StsOk = {
  access_token: string;
  expires_in?: number;
  issued_token_type?: string;
  token_type?: string;
};

type IamGenerateIdTokenOk = {
  token: string;
};

type DebugWif = {
  wifAudience: string;
  serviceAccount: string;
  stsStatus?: number;
  stsBody?: unknown;
  iamStatus?: number;
  iamBody?: unknown;
};

/**
 * ✅ Vercel → GCP WIF (sin API keys, sin ADC).
 * Usa x-vercel-oidc-token como subject_token.
 */
async function getIdTokenViaWifFromVercel(
  audience: string,
  oidcToken: string,
): Promise<{ idToken: string; debug: DebugWif }> {
  const projectNumber = envOrThrow("GCP_PROJECT_NUMBER");
  const poolId = envOrThrow("WIF_POOL_ID");
  const providerId = envOrThrow("WIF_PROVIDER_ID");
  const serviceAccount = envOrThrow("GCP_SERVICE_ACCOUNT");

  const wifAudience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;

  const debug: DebugWif = {
    wifAudience,
    serviceAccount,
  };

  // 1) STS token exchange: Vercel OIDC -> access_token federado
  const stsResp = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      subject_token: oidcToken,
      audience: wifAudience,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    }).toString(),
  });

  debug.stsStatus = stsResp.status;

  const stsJson = (await stsResp.json().catch(() => ({}))) as Partial<StsOk> & {
    error?: unknown;
    error_description?: unknown;
  };
  debug.stsBody = stsJson;

  if (!stsResp.ok || !stsJson?.access_token) {
    console.error("[wif] sts failed", { status: stsResp.status, body: stsJson });
    throw new Error(`STS exchange failed: ${stsResp.status}`);
  }

  const federatedAccessToken = stsJson.access_token;

  // 2) IAMCredentials: access_token federado -> ID token del Service Account (para Cloud Run)
  const iamUrl = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(
    serviceAccount,
  )}:generateIdToken`;

  const idResp = await fetch(iamUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${federatedAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience,
      includeEmail: true,
    }),
  });

  debug.iamStatus = idResp.status;

  const idJson = (await idResp.json().catch(() => ({}))) as Partial<IamGenerateIdTokenOk> & {
    error?: unknown;
  };
  debug.iamBody = idJson;

  if (!idResp.ok || !idJson?.token) {
    console.error("[wif] generateIdToken failed", {
      status: idResp.status,
      body: idJson,
    });
    throw new Error(`generateIdToken failed: ${idResp.status}`);
  }

  return { idToken: idJson.token, debug };
}

function oidcPreview(oidc: string) {
  // No mostramos todo el token. Solo longitud y un preview seguro.
  return {
    len: oidc.length,
    head: oidc.slice(0, 24),
    tail: oidc.slice(-16),
  };
}

async function handler(req: NextRequest, pathParts: string[]) {
  const cloudRunUrl = envOrThrow("CLOUD_RUN_URL"); // ej: https://...run.app
  const targetSa = envOrThrow("GCP_SERVICE_ACCOUNT"); // vercel-bff-invoker@...

  const audience = cloudRunUrl.replace(/\/$/, "");
  const targetPath = pathParts.join("/");
  const targetUrl = joinUrl(audience, targetPath) + req.nextUrl.search;

  try {
    const oidc = req.headers.get("x-vercel-oidc-token");

    // Debug simple: confirma que Vercel sí está mandando OIDC
    if (req.nextUrl.searchParams.get("__oidc") === "1") {
      return NextResponse.json({
        hasOidc: !!oidc,
        oidcLen: oidc?.length ?? 0,
        vercelEnv: process.env.VERCEL_ENV,
        mode: process.env.GCP_PROXY_MODE,
      });
    }

    // Modo:
    // - En Vercel: default "wif"
    // - En local: puedes usar "gcloud"
    const mode = (
      process.env.GCP_PROXY_MODE || (process.env.VERCEL ? "wif" : "gcloud")
    ).toLowerCase();

    let idToken = "";

    if (mode === "wif") {
      if (!oidc) {
        return NextResponse.json(
          { error: "Missing Vercel OIDC token" },
          { status: 401 },
        );
      }

      // __debug=2: antes de generar nada, decodifica OIDC de Vercel y luego intenta WIF
      if (req.nextUrl.searchParams.get("__debug") === "2") {
        const oidcClaims = decodeJwtClaims(oidc);
        try {
          const { idToken: tok, debug } = await getIdTokenViaWifFromVercel(
            audience,
            oidc,
          );

          return NextResponse.json({
            mode,
            audience,
            targetUrl,
            oidcPreview: oidcPreview(oidc),
            oidcClaims, // sub/iss/aud reales que determinan tu principalSet
            wif: {
              wifAudience: debug.wifAudience,
              serviceAccount: debug.serviceAccount,
              stsStatus: debug.stsStatus,
              iamStatus: debug.iamStatus,
            },
            idTokenClaims: decodeJwtClaims(tok),
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return NextResponse.json(
            {
              mode,
              audience,
              targetUrl,
              oidcPreview: oidcPreview(oidc),
              oidcClaims,
              error: msg,
              note: "Si falla aquí, es STS o IAMCredentials (impersonation), no Cloud Run.",
            },
            { status: 500 },
          );
        }
      }

      // Normal: generar token por WIF
      const res = await getIdTokenViaWifFromVercel(audience, oidc);
      idToken = res.idToken;

      // __debug=1: muestra claims del ID token final (el que va a Cloud Run)
      if (req.nextUrl.searchParams.get("__debug") === "1") {
        return NextResponse.json({
          mode,
          audience,
          targetUrl,
          tokenClaims: decodeJwtClaims(idToken),
        });
      }
    } else if (mode === "gcloud") {
      idToken = await getIdTokenViaGcloud(targetSa, audience);
    } else {
      throw new Error(
        `Unsupported GCP_PROXY_MODE="${mode}". Use "wif" (Vercel) or "gcloud" (local).`,
      );
    }

    const method = req.method.toUpperCase();
    const body =
      method === "GET" || method === "HEAD" ? undefined : await req.text();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${idToken}`,
      Accept: req.headers.get("accept") || "application/json",
    };

    const ct = req.headers.get("content-type");
    if (body !== undefined) headers["Content-Type"] = ct || "application/json";

    const upstream = await fetch(targetUrl, { method, headers, body });

    const respText = await upstream.text();
    const respCt = upstream.headers.get("content-type") || "application/json";

    if (!upstream.ok) {
      console.error("[proxy] upstream error", {
        status: upstream.status,
        url: targetUrl,
        body: respText?.slice?.(0, 500),
      });
    }

    return new NextResponse(respText, {
      status: upstream.status,
      headers: { "Content-Type": respCt },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[proxy] exception", msg);
    return NextResponse.json(
      { error: "Proxy exception", message: msg },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handler(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handler(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handler(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handler(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handler(req, path);
}
