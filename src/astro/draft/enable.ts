import type { APIRoute } from "astro";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import {
  cookieSecureOptions,
  getIsrBypassToken,
  PRERENDER_BYPASS_COOKIE,
} from "./isr-bypass";
import { getSanityClient } from "./preview";

type CreateEnableRouteOptions = {
  siteUrl: string;
  isrBypassTokenEnvKey?: string;
};

function normalizeRedirectPath(rawUrl: string | undefined, siteUrl: string): string {
  if (!rawUrl) return "/";
  try {
    const parsed = rawUrl.startsWith("http")
      ? new URL(rawUrl)
      : new URL(rawUrl, siteUrl);
    const value = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return value.startsWith("/") ? value : "/";
  } catch {
    return "/";
  }
}

export function createEnableDraftModeRoute({
  siteUrl,
  isrBypassTokenEnvKey = "ISR_BYPASS_TOKEN",
}: CreateEnableRouteOptions): APIRoute {
  return async ({ request, cookies, redirect }) => {
    const previewClient = getSanityClient(true);
    const validation = await validatePreviewUrl(previewClient, request.url);

    if (!validation.isValid) {
      return new Response("Invalid preview URL", { status: 401 });
    }

    const target = normalizeRedirectPath(validation.redirectTo, siteUrl);
    const base = cookieSecureOptions(request.url);
    const perspective = validation.studioPreviewPerspective || "drafts";
    const perspectiveValue =
      typeof perspective === "string" ? perspective : JSON.stringify(perspective);

    cookies.set(perspectiveCookieName, perspectiveValue, {
      ...base,
      httpOnly: false,
    });

    const bypassToken = getIsrBypassToken(isrBypassTokenEnvKey);
    if (bypassToken) {
      cookies.set(PRERENDER_BYPASS_COOKIE, bypassToken, {
        ...base,
        httpOnly: true,
      });
    }

    return redirect(target, 302);
  };
}
