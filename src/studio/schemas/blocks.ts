import { maxVideoFileSize } from "../lib/maxVideoFileSize";
import {
  videoDimensionFields,
  videoPosterField,
} from "../lib/videoDerivedFields";
import { imageMaskOptions } from "../../astro/blocks/masks";
import { ImageMaskInput } from "../inputs/ImageMaskInput";
import { SpacedField } from "../inputs/SpacedField";
import { VideoFileInput } from "../inputs/VideoFileInput";

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
  components: {
    input: VideoFileInput,
  },
  fields: [
    {
      name: "alt",
      type: "string",
      title: "Alt text",
      description: "Alternative text for accessibility.",
      components: { field: SpacedField },
    },
    videoPosterField,
    ...videoDimensionFields,
  ],
  validation: maxVideoFileSize,
  preview: {
    select: {
      media: "poster",
      title: "alt",
      filename: "asset.originalFilename",
    },
    prepare: ({
      media,
      title,
      filename,
    }: {
      media?: unknown;
      title?: string;
      filename?: string;
    }) => ({
      media,
      title: title || filename || "Video file",
      subtitle: "Video",
    }),
  },
};

export const imageMaskBlock = {
  name: "imageMask",
  type: "object",
  title: "Image mask",
  fields: [
    {
      name: "image",
      type: "image",
      title: "Image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
    },
    {
      name: "mask",
      type: "string",
      title: "Mask",
      options: { list: imageMaskOptions, layout: "radio" },
      initialValue: "triangle",
    },
  ],
  components: {
    input: ImageMaskInput,
  },
  preview: {
    select: {
      image: "image",
      mask: "mask",
    },
    prepare: ({
      image,
      mask,
    }: {
      image?: unknown;
      mask?: string;
    }) => ({
      title: mask || "Image mask",
      subtitle: "Image mask",
      media: image,
    }),
  },
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
  | "imageMask"
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
  if (include.has("imageMask")) blocks.push(imageMaskBlock);
  if (include.has("media")) blocks.push(mediaBlock);
  if (include.has("videoFile")) blocks.push(videoFileBlock);
  if (include.has("columns")) blocks.push(columnsBlock);
  return blocks;
}
