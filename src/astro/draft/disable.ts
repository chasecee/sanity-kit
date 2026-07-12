import type { APIRoute } from "astro";
import {
  perspectiveCookieName,
  urlSearchParamPreviewPathname,
} from "@sanity/preview-url-secret/constants";
import { PRERENDER_BYPASS_COOKIE } from "./isr-bypass";

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

  cookies.delete(perspectiveCookieName, { path: "/" });
  cookies.delete(PRERENDER_BYPASS_COOKIE, { path: "/" });

  return redirect(target, 302);
};
