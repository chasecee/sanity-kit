export const PRERENDER_BYPASS_COOKIE = "__prerender_bypass";

function readEnv(key: string): string | undefined {
  const meta = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env;
  return meta?.[key] ?? process.env[key];
}

export function getIsrBypassToken(envKey = "ISR_BYPASS_TOKEN"): string | undefined {
  return readEnv(envKey);
}

export function cookieSecureOptions(requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:";
  return {
    path: "/",
    secure,
    sameSite: (secure ? "none" : "lax") as "none" | "lax",
  };
}
