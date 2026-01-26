import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { GoogleAuth, Impersonated } from "google-auth-library";

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

async function getIdTokenViaIamCreds(targetSa: string, audience: string) {
  const auth = new GoogleAuth({ projectId: process.env.GCP_PROJECT_ID });
  const sourceClient = await auth.getClient();

  const impersonated = new Impersonated({
    sourceClient,
    targetPrincipal: targetSa,
    targetScopes: ["https://www.googleapis.com/auth/cloud-platform"],
    lifetime: 300,
  });

  const accessHeaders = await (impersonated as any).getRequestHeaders?.();
  const accessAuth =
    accessHeaders?.Authorization ||
    accessHeaders?.authorization ||
    accessHeaders?.["Authorization"] ||
    accessHeaders?.["authorization"];

  if (!accessAuth) throw new Error("No access token from Impersonated client");

  const iamUrl = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(
    targetSa
  )}:generateIdToken`;

  const tokenResp = await fetch(iamUrl, {
    method: "POST",
    headers: { Authorization: accessAuth, "Content-Type": "application/json" },
    body: JSON.stringify({ audience, includeEmail: true }),
  });

  const tokenJson = (await tokenResp.json().catch(() => ({}))) as any;

  if (!tokenResp.ok || !tokenJson?.token) {
    console.error("[proxy] generateIdToken failed", {
      status: tokenResp.status,
      body: tokenJson,
    });
    throw new Error(`generateIdToken failed: ${tokenResp.status}`);
  }

  return tokenJson.token as string;
}

async function handler(req: NextRequest, pathParts: string[]) {
  const cloudRunUrl = envOrThrow("CLOUD_RUN_URL"); // ej: https://...run.app
  const targetSa = envOrThrow("GCP_SERVICE_ACCOUNT"); // ej: vercel-bff-invoker@...

  const audience = cloudRunUrl.replace(/\/$/, "");
  const targetPath = pathParts.join("/");
  const targetUrl = joinUrl(audience, targetPath) + req.nextUrl.search;

  try {
    const mode = (process.env.GCP_PROXY_MODE || "iamcreds").toLowerCase();

    const idToken =
      mode === "gcloud"
        ? await getIdTokenViaGcloud(targetSa, audience)
        : await getIdTokenViaIamCreds(targetSa, audience);

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
      { status: 500 }
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
