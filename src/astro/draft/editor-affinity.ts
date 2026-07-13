import { cookieSecureOptions } from "./isr-bypass";

export const EDITOR_AFFINITY_COOKIE = "sanity-kit-editor";

type CookieValue = { value?: string } | undefined;

type CookiesReader = {
  get: (name: string) => CookieValue;
};

type CookiesWriter = CookiesReader & {
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  delete: (name: string, options: Record<string, unknown>) => void;
};

export function hasEditorAffinity(cookies: CookiesReader): boolean {
  return cookies.get(EDITOR_AFFINITY_COOKIE)?.value === "1";
}

export function isEditorRequest(request?: Request): boolean {
  if (!request) return false;
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes(`${EDITOR_AFFINITY_COOKIE}=1`);
}

export function setEditorAffinity(cookies: CookiesWriter, requestUrl: string) {
  const base = cookieSecureOptions(requestUrl);
  cookies.set(EDITOR_AFFINITY_COOKIE, "1", {
    ...base,
    httpOnly: false,
  });
}

export function clearEditorAffinity(cookies: CookiesWriter, requestUrl: string) {
  const base = cookieSecureOptions(requestUrl);
  cookies.delete(EDITOR_AFFINITY_COOKIE, base);
}
