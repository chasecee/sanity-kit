type ResolveContext = {
  document?: { slug?: { current?: string }; _type?: string };
  schemaType?: string;
};

type ResolveDocumentUrlFn = (
  baseUrl: string,
  previousUrl: string | undefined,
  context: ResolveContext,
) => string;

let SITE_URL = "https://example.com";
let LOCAL_SITE_URL = "http://localhost:4321";
let resolveImpl: ResolveDocumentUrlFn = (baseUrl, previousUrl, context) => {
  const base = baseUrl.replace(/\/$/, "");
  const slug = context.document?.slug?.current;
  const type = context.schemaType || context.document?._type;
  if (type === "project" && slug) return `${base}/projects/${slug}`;
  if (type === "page" && slug) return slug === "home" ? base : `${base}/${slug}`;
  return previousUrl || base;
};

export function configureStudioPreviewUrls(options: {
  siteUrl?: string;
  localSiteUrl?: string;
  resolveDocumentUrl?: ResolveDocumentUrlFn;
}) {
  if (options.siteUrl) SITE_URL = options.siteUrl.replace(/\/$/, "");
  if (options.localSiteUrl) {
    LOCAL_SITE_URL = options.localSiteUrl.replace(/\/$/, "");
  }
  if (options.resolveDocumentUrl) resolveImpl = options.resolveDocumentUrl;
}

export function getSiteBaseUrl() {
  const fromEnv = process.env.SANITY_STUDIO_PREVIEW_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (
    typeof location !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ) {
    return LOCAL_SITE_URL;
  }

  return SITE_URL;
}

export function resolveDocumentUrl(
  baseUrl: string,
  previousUrl: string | undefined,
  context: ResolveContext,
) {
  return resolveImpl(baseUrl, previousUrl, context);
}

export function resolveProductionUrl(
  previousUrl: string | undefined,
  context: ResolveContext,
) {
  return resolveDocumentUrl(SITE_URL, previousUrl, context);
}

export async function resolveProductionUrlAsync(
  previousUrl: string | undefined,
  context: ResolveContext,
) {
  return resolveProductionUrl(previousUrl, context);
}
