import type { APIRoute } from "astro";

export type IsrRevalidateBody = Record<string, unknown>;

export type CreateIsrRevalidateRouteOptions = {
  siteUrl: string;
  resolvePaths: (body: IsrRevalidateBody) => string[] | Promise<string[]>;
  settleMs?: number;
  bypassTokenEnvKey?: string;
  revalidateSecretEnvKey?: string;
};

function readEnv(key: string): string | undefined {
  const meta = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env;
  return meta?.[key] ?? process.env[key];
}

async function invalidatePath(siteUrl: string, path: string, bypassToken: string) {
  const base = siteUrl.replace(/\/$/, "");
  return fetch(`${base}${path}`, {
    method: "HEAD",
    headers: { "x-prerender-revalidate": bypassToken },
  }).catch(() => {});
}

export function createIsrRevalidateRoute(
  options: CreateIsrRevalidateRouteOptions,
): APIRoute {
  const {
    siteUrl,
    resolvePaths,
    settleMs = 2000,
    bypassTokenEnvKey = "ISR_BYPASS_TOKEN",
    revalidateSecretEnvKey = "REVALIDATE_SECRET",
  } = options;

  return async ({ request }) => {
    const bypassToken = readEnv(bypassTokenEnvKey);
    const revalidateSecret = readEnv(revalidateSecretEnvKey);

    if (!bypassToken || !revalidateSecret) {
      return new Response("Server misconfiguration", { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${revalidateSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: IsrRevalidateBody;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const paths = [...new Set(await resolvePaths(body))];

    if (paths.length === 0) {
      return new Response(JSON.stringify({ revalidated: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    await new Promise((r) => setTimeout(r, settleMs));
    await Promise.all(paths.map((p) => invalidatePath(siteUrl, p, bypassToken)));

    return new Response(JSON.stringify({ revalidated: paths }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}
