# ISR + Blueprints rollout

This runbook standardizes ISR webhook rollout for Astro + Vercel + Sanity projects that consume `@chasecee/sanity-kit`.

## 1) Prerequisites

- Site uses `@astrojs/vercel` with `output: "server"`.
- Site has `ISR_BYPASS_TOKEN` and `REVALIDATE_SECRET` in local `.env.local`.
- Vercel project has matching `ISR_BYPASS_TOKEN` and `REVALIDATE_SECRET` in production env.
- Sanity CLI auth is valid (`bunx sanity@latest login`).

## 2) Wire ISR in site

`apps/site/astro.config.mjs`:

```js
adapter: vercel({
  isr: {
    bypassToken: process.env.ISR_BYPASS_TOKEN,
    exclude: [/^\/api\/.+/],
  },
})
```

Draft/preview must also set Vercel’s `__prerender_bypass` cookie (same value as `ISR_BYPASS_TOKEN`) when enabling draft mode. `@chasecee/sanity-kit` does this in `createEnableDraftModeRoute` / `disableDraftModeGet`. Without it, a draft render can be written into the ISR cache and served to everyone.


`apps/site/src/pages/api/revalidate.ts`:

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

## 3) Define webhook as code

Create root `sanity.blueprint.ts`:

```ts
import { defineBlueprint, defineDocumentWebhook } from "@sanity/blueprints";

export default defineBlueprint({
  resources: [
    defineDocumentWebhook({
      name: "vercel-isr-revalidate",
      displayName: "Vercel ISR revalidate",
      on: ["create", "update", "delete"],
      url: "https://your-site.com/api/revalidate",
      filter: '_type in ["page"]',
      projection: "{_type, slug}",
      dataset: "production",
      apiVersion: "v2026-01-01",
      httpMethod: "POST",
      includeDrafts: false,
      headers: {
        Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`,
      },
    }),
  ],
});
```

Add root scripts:

```json
"blueprints:plan": "bunx sanity@latest blueprints plan",
"blueprints:deploy": "bunx sanity@latest blueprints deploy",
"blueprints:destroy": "bunx sanity@latest blueprints destroy"
```

## 4) Deploy in safe order

1. Build locally first:
   - `bun run build`
2. Link/check Vercel project:
   - `bunx vercel@latest link`
3. Verify Vercel production env has both secrets:
   - `bunx vercel@latest env ls`
4. Initialize/rebind blueprint stack once per repo:
   - `bunx sanity@latest blueprints init . --blueprint-type ts --project-id <id> --stack-name production`
5. Preview changes:
   - `bun run blueprints:plan`
6. Deploy blueprint:
   - `export REVALIDATE_SECRET=...`
   - `bun run blueprints:deploy`
7. Remove legacy Manage webhooks for rebuild/duplicate ISR delivery.

## 5) Verification

Smoke-test endpoint auth:

```bash
# expect 401
curl -i -X POST https://your-site.com/api/revalidate \
  -H 'Content-Type: application/json' \
  -d '{"_type":"page","slug":{"current":"about"}}'

# expect 200
curl -i -X POST https://your-site.com/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"_type":"page","slug":{"current":"about"}}'
```

Verify webhook is present:

```bash
bunx sanity@latest hooks list --project-id <projectId>
```

Verify deliveries:
- Sanity Manage → API → Webhooks → Recent deliveries
- Expect HTTP 200 and payload path coverage matching site routing

## 6) Operational notes

- If blueprint deploy fails with webhook quota, delete old hooks first.
- If endpoint returns 401 with valid local secret, compare local and Vercel production env values and re-align.
- `blueprints destroy` removes remote resources; re-run `blueprints init` before next deploy.
