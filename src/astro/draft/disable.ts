import type { APIRoute } from "astro";
import {
  perspectiveCookieName,
  urlSearchParamPreviewPathname,
} from "@sanity/preview-url-secret/constants";
import { cookieSecureOptions, PRERENDER_BYPASS_COOKIE } from "./isr-bypass";
import { clearEditorAffinity } from "./editor-affinity";

function normalizeRedirectPath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export const disableDraftModeGet: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const pathFromQuery =
    url.searchParams.get(urlSearchParamPreviewPathname) ||
    url.searchParams.get("redirect");
  const target = normalizeRedirectPath(pathFromQuery);
  const base = cookieSecureOptions(request.url);

  cookies.delete(perspectiveCookieName, base);

  return redirect(target, 302);
};

export const dismissEditorModeGet: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const pathFromQuery =
    url.searchParams.get(urlSearchParamPreviewPathname) ||
    url.searchParams.get("redirect");
  const target = normalizeRedirectPath(pathFromQuery);
  const base = cookieSecureOptions(request.url);

  clearEditorAffinity(cookies, request.url);
  cookies.delete(PRERENDER_BYPASS_COOKIE, base);

  return redirect(target, 302);
};
