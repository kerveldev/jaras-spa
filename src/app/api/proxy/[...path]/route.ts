import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { GoogleAuth } from "google-auth-library";
import { promises as fs } from "node:fs";

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
  const gcloud = raw.replace(/^"+|"+$/g, ""); // quita comillas si vienen
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

function readAuthHeader(h: unknown): string | undefined {
  // Caso 1: Headers (tiene .get)
  if (
    h &&
    typeof h === "object" &&
    "get" in h &&
    typeof (h as any).get === "function"
  ) {
    return (
      (h as Headers).get("authorization") ??
      (h as Headers).get("Authorization") ??
      undefined
    );
  }

  // Caso 2: objeto plano Record<string,string>
  if (h && typeof h === "object") {
    const obj = h as Record<string, string | undefined>;
    return obj.authorization ?? obj.Authorization;
  }

  return undefined;
}

/**
 * ✅ Vercel → GCP WIF (sin API keys, sin ADC).
 * Usa x-vercel-oidc-token como subject_token.
 */
async function getIdTokenViaWifFromVercel(audience: string, oidcToken: string) {
  const projectNumber = envOrThrow("GCP_PROJECT_NUMBER");
  const poolId = envOrThrow("WIF_POOL_ID");
  const providerId = envOrThrow("WIF_PROVIDER_ID");
  const serviceAccount = envOrThrow("GCP_SERVICE_ACCOUNT");

  // 1) Guardar el OIDC de Vercel a /tmp
  const subjectTokenPath = "/tmp/vercel-oidc-token";
  await fs.writeFile(subjectTokenPath, oidcToken, "utf8");

  // 2) External Account JSON
  const wifJsonPath = "/tmp/gcp-wif.json";
  const wif = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    credential_source: {
      file: subjectTokenPath,
    },
  };

  await fs.writeFile(wifJsonPath, JSON.stringify(wif), "utf8");

  // 3) Forzar a google-auth-library a usar este archivo
  process.env.GOOGLE_APPLICATION_CREDENTIALS = wifJsonPath;

  // 4) Pedir ID Token para Cloud Run (audience = URL del servicio)
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(audience);
  const headers = await client.getRequestHeaders();
  const bearer = readAuthHeader(headers);

  if (!bearer) throw new Error("No Authorization header from IdTokenClient");

  return bearer.replace(/^Bearer\s+/i, "");
}

async function handler(req: NextRequest, pathParts: string[]) {
  const cloudRunUrl = envOrThrow("CLOUD_RUN_URL"); // ej: https://...run.app
  const targetSa = envOrThrow("GCP_SERVICE_ACCOUNT"); // vercel-bff-invoker@...

  const audience = cloudRunUrl.replace(/\/$/, "");
  const targetPath = pathParts.join("/");
  const targetUrl = joinUrl(audience, targetPath) + req.nextUrl.search;

  try {
    const oidc = req.headers.get("x-vercel-oidc-token");

    // Debug sin tocar google auth
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

    let idToken: string;

    if (mode === "wif") {
      if (!oidc) {
        return NextResponse.json(
          { error: "Missing Vercel OIDC token" },
          { status: 401 },
        );
      }
      idToken = await getIdTokenViaWifFromVercel(audience, oidc);
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
  } catch (e: any) {
    console.error("[proxy] exception", e?.message || e);
    return NextResponse.json(
      { error: "Proxy exception", message: e?.message || String(e) },
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
