const MAX_VIDEO_BYTES = 100_000_000;

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

export const videoFileBlock = {
  name: "videoFile",
  type: "file",
  title: "Video file",
  options: { accept: "video/mp4,video/webm,.mp4,.webm" },
  fields: [
    {
      name: "alt",
      type: "string",
      title: "Alt text",
      description: "Alternative text for accessibility.",
    },
  ],
  validation: (Rule: any) =>
    Rule.custom(async (value: { asset?: { _ref?: string } } | undefined, context: any) => {
      const ref = value?.asset?._ref;
      if (!ref) return true;
      const client = context.getClient({ apiVersion: "2025-01-01" });
      const size = await client.fetch(`*[_id == $id][0].size`, { id: ref });
      if (typeof size === "number" && size > MAX_VIDEO_BYTES) {
        return "Video must be 100MB or smaller";
      }
      return true;
    }),
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
  | "videoFile"
  | "columns";

export function contentBlocks(options?: { include?: ContentBlockType[] }) {
  const include = new Set<ContentBlockType>(
    options?.include ?? ["embed", "spotify", "gallery", "image", "media", "videoFile"],
  );
  const blocks: Array<Record<string, unknown>> = [];
  if (include.has("embed")) blocks.push({ type: "embed" });
  if (include.has("spotify")) blocks.push({ type: "spotify" });
  if (include.has("gallery")) blocks.push({ type: "gallery" });
  if (include.has("skills")) blocks.push({ type: "skills" });
  if (include.has("image")) blocks.push(imageBlock);
  if (include.has("media")) blocks.push(mediaBlock);
  if (include.has("videoFile")) blocks.push(videoFileBlock);
  if (include.has("columns")) blocks.push(columnsBlock);
  return blocks;
}
