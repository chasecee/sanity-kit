import { createClient, type ClientPerspective } from "@sanity/client";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import { getAstroDraftConfig } from "./config";

export function isPreviewRequest(request?: Request): boolean {
  if (!request) return false;
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes(`${perspectiveCookieName}=`);
}

export function parsePerspective(
  raw: string | undefined,
): ClientPerspective | undefined {
  if (!raw) return undefined;
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith("[")) {
    try {
      return JSON.parse(decoded) as ClientPerspective;
    } catch {
      return undefined;
    }
  }
  return decoded as ClientPerspective;
}

export function getPerspectiveCookie(
  cookies: { get: (name: string) => { value: string } | undefined },
): ClientPerspective {
  return parsePerspective(cookies.get(perspectiveCookieName)?.value) ?? "drafts";
}

export function draftFetchOptions(locals: {
  draftMode: boolean;
  perspective?: ClientPerspective;
}) {
  if (!locals.draftMode) return { preview: false as const };
  return {
    preview: true as const,
    perspective: locals.perspective ?? ("drafts" as const),
  };
}

export function getSanityClient(
  preview = false,
  perspective: ClientPerspective = "drafts",
) {
  const config = getAstroDraftConfig();
  if (!preview) {
    return createClient(config.clientConfig);
  }

  const tokenKey = config.readTokenEnvKey || "SANITY_API_READ_TOKEN";
  const token =
    import.meta.env[tokenKey] || process.env[tokenKey];
  if (!token) {
    throw new Error(
      "SANITY_API_READ_TOKEN is required for draft mode / visual editing.",
    );
  }

  return createClient({
    ...config.clientConfig,
    useCdn: false,
    token,
    perspective,
    stega: {
      enabled: true,
      studioUrl: config.studioUrl,
    },
  });
}
