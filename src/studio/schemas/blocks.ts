export const imageBlock = {
  type: "image",
  options: { hotspot: true },
  fields: [{ name: "alt", type: "string", title: "Alt Text" }],
};

export const mediaBlock = {
  name: "media",
  type: "object",
  title: "Media",
  fields: [{ name: "media", type: "file", title: "Media file" }],
};

export const columnsBlock = {
  type: "columns",
};

type ContentBlockType =
  | "embed"
  | "spotify"
  | "gallery"
  | "skills"
  | "image"
  | "media"
  | "columns";

export function contentBlocks(options?: { include?: ContentBlockType[] }) {
  const include = new Set<ContentBlockType>(
    options?.include ?? ["embed", "spotify", "gallery", "skills", "image", "media"],
  );
  const blocks: Array<Record<string, unknown>> = [];
  if (include.has("embed")) blocks.push({ type: "embed" });
  if (include.has("spotify")) blocks.push({ type: "spotify" });
  if (include.has("gallery")) blocks.push({ type: "gallery" });
  if (include.has("skills")) blocks.push({ type: "skills" });
  if (include.has("image")) blocks.push(imageBlock);
  if (include.has("media")) blocks.push(mediaBlock);
  if (include.has("columns")) blocks.push(columnsBlock);
  return blocks;
}
