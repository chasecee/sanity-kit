# sanity-kit

Shared Sanity Studio and Astro runtime utilities.

## Install

```json
"@chasecee/sanity-kit": "github:chasecee/sanity-kit"
```

## Local Development

Consumer dev servers alias `@chasecee/sanity-kit` to this repo when it exists as a sibling checkout, so kit edits hot-reload instantly. No linking or dependency changes needed; `package.json` always keeps the `github:` ref, and Vercel builds (no sibling checkout) use the installed package.

The aliases live in each consumer's `apps/admin/sanity.cli.ts` (vite override) and `apps/site/astro.config.mjs` (vite `resolve.alias`). After pushing kit changes, run `bun sync` here to update consumers' pinned installs.

## Exports

- `@chasecee/sanity-kit/studio`
- `@chasecee/sanity-kit/astro`
- `kitStudioConfig` from `@chasecee/sanity-kit/studio` disables Content Releases by default

## ISR revalidation

`createIsrRevalidateRoute` from `@chasecee/sanity-kit/astro` handles Bearer auth, settle delay, and Vercel ISR bust via `x-prerender-revalidate`. Sites supply `siteUrl` + `resolvePaths`.

Draft middleware sets `Cache-Control: private, no-store` only in draft mode. Published HTML cache is left to Vercel ISR.

Required site env: `ISR_BYPASS_TOKEN`, `REVALIDATE_SECRET`.

Full rollout and verification checklist: `docs/isr-blueprints-rollout.md`.

## Recommended Consumer Repo Structure

Use this layout for each site repo:

```text
your-site/
  package.json
  bun.lock
  .env.local
  apps/
    site/
      package.json
      astro.config.mjs
      tsconfig.json
      src/
      public/
    admin/
      package.json
      sanity.config.ts
      sanity.cli.ts
      schemas/
```

### Root `package.json` (workspace + orchestration)

```json
{
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "bun run --parallel site:dev studio:dev",
    "site:dev": "bun run --filter site dev",
    "build": "bun run --filter site build",
    "preview": "bun run --filter site preview",
    "studio:dev": "bun run --cwd apps/admin --env-file=../../.env.local dev",
    "studio:build": "bun run --cwd apps/admin --env-file=../../.env.local build"
  }
}
```

### `apps/site/package.json`

- Keep Astro + runtime deps here.
- Add:

```json
"@chasecee/sanity-kit": "github:chasecee/sanity-kit"
```

### `apps/admin/package.json`

- Keep Studio deps here.
- Add:

```json
"@chasecee/sanity-kit": "github:chasecee/sanity-kit"
```

### ISR webhook receiver

`apps/site/src/pages/api/revalidate.ts`

```ts
import { createIsrRevalidateRoute } from "@chasecee/sanity-kit/astro";

export const prerender = false;

export const POST = createIsrRevalidateRoute({
  siteUrl: "https://your-site.com",
  resolvePaths(body) {
    const type = body._type as string | undefined;
    const slug = (body.slug as { current?: string } | undefined)?.current;
    if (type === "page" && slug) return [`/${slug}`];
    return [];
  },
});
```

Pair with Vercel ISR in `astro.config.mjs` (`isr.bypassToken`, `exclude: [/^\/api\/.+/]`) and a root `sanity.blueprint.ts` webhook. Draft enable sets `__prerender_bypass` from `ISR_BYPASS_TOKEN` so preview HTML is never written into the ISR cache.

## Site Wiring (Astro)

### Configure kit draft runtime once

Create `apps/site/sanity/preview.ts`:

```ts
import { configureAstroDraft } from "@chasecee/sanity-kit/astro";
import config from "./config/client-config";
import { STUDIO_URL } from "./studio-url";

configureAstroDraft({
  clientConfig: config,
  studioUrl: STUDIO_URL,
  readTokenEnvKey: "SANITY_API_READ_TOKEN",
});

export {
  isPreviewRequest,
  parsePerspective,
  getPerspectiveCookie,
  draftFetchOptions,
  getSanityClient,
} from "@chasecee/sanity-kit/astro";
```

### Re-export kit draft helpers

`apps/site/sanity/load-query.ts`

```ts
import "./preview";
export { loadQuery, getDraftModeProps } from "@chasecee/sanity-kit/astro";
```

`apps/site/sanity/live.ts`

```ts
import "./preview";
export { useLiveQuery } from "@chasecee/sanity-kit/astro";
```

`apps/site/src/middleware.ts`

```ts
export { draftMiddleware as onRequest } from "@chasecee/sanity-kit/astro";
```

`apps/site/src/pages/api/draft-mode/enable.ts`

```ts
import "@/sanity/preview";
import { createEnableDraftModeRoute } from "@chasecee/sanity-kit/astro";

export const prerender = false;
export const GET = createEnableDraftModeRoute({ siteUrl: "https://your-site.com" });
```

`apps/site/src/pages/api/draft-mode/disable.ts`

```ts
import { disableDraftModeGet } from "@chasecee/sanity-kit/astro";

export const prerender = false;
export const GET = disableDraftModeGet;
```

## Studio Wiring (Sanity)

### Configure project-specific URL routing once

In `apps/admin/sanity.config.ts`:

```ts
import {
  configureStudioPreviewUrls,
  StudioNavbar,
  DocumentLayout,
  withPublishShortcut,
  galleryPlugin,
  getSiteBaseUrl,
  resolveProductionUrlAsync,
} from "@chasecee/sanity-kit/studio";

configureStudioPreviewUrls({
  siteUrl: "https://your-site.com",
  localSiteUrl: "http://localhost:4321",
  resolveDocumentUrl(baseUrl, previousUrl, context) {
    const base = baseUrl.replace(/\/$/, "");
    const slug = context.document?.slug?.current;
    const type = context.schemaType || context.document?._type;
    if (type === "project" && slug) return `${base}/projects/${slug}`;
    if (type === "page" && slug) return slug === "home" ? base : `${base}/${slug}`;
    return previousUrl || base;
  },
});
```

### Compose schemas from kit + local docs

In `apps/admin/schemas/index.ts`:

```ts
import { embedSchema, spotifySchema, columnsSchema } from "@chasecee/sanity-kit/studio";
import project from "./project-schema";
import page from "./page-schema";

export default [project, page, embedSchema, spotifySchema, columnsSchema];
```

In local document schemas:

```ts
import { columnsBlock, contentBlocks, ColumnsPortableTextPlugin } from "@chasecee/sanity-kit/studio";

// ...
of: [{ type: "block" }, columnsBlock, ...contentBlocks()],
```

## Required Env Vars

At repo root `.env.local`:

```bash
SANITY_API_READ_TOKEN=...
SANITY_STUDIO_PREVIEW_URL=http://localhost:4321
```

For Studio project ids/dataset, keep using your existing `SANITY_STUDIO_*` and/or `PUBLIC_SANITY_*` vars per project.

## Deployment

- Site project root directory: `apps/site`
- Admin project root directory: `apps/admin` (if hosting Studio on Vercel)
- If using `sanity deploy` for Studio, only the site needs a Vercel project.
