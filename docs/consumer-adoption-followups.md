# Consumer adoption follow-ups

Track these in separate PRs from kit extraction work.

## rockyvelvet.space

- Done: `DraftModeActions` from `@chasecee/sanity-kit/astro/visual-editing`.
- Done: kit `galleryPlugin`, `Body`, and conditional `contentHasBlock` lightbox loading.
- Done: generated query types via `defineQuery` + root `typegen` script.

## ianrigby.com

- Done: `SanityVisualEditing` + draft mode actions in site layout.
- Done: kit `Body` for rich text blocks.
- Intentionally separate: custom masonry gallery stack (page-builder blocks, deep-link URLs, related-post captions). Do not migrate to kit `galleryPlugin` without a deliberate content migration.

## chasecee.com

- Reference consumer for kit gallery, conditional lightbox, and draft/ISR stack.
- Site-specific extensions kept local: `siteMini` block, music domain, physics hero.

## Shared

- Align all consumers on the same `@chasecee/sanity-kit` commit via `bun run sync` from the kit root.
- PhotoSwipe theme CSS lives per consumer (`apps/site/src/styles/galleryLightbox.css` on chasecee/rockyvelvet; inline in ian `ImageGalleryLightbox.astro`).
