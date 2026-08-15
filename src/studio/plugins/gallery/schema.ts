// Preview selects images.0–5 so the preview store does not observe the whole array.
import type { ArrayOfObjectsInputProps, ImageValue } from "sanity";
import type React from "react";
import { maxVideoFileSize } from "../../lib/maxVideoFileSize";
import {
  videoDimensionFields,
  videoPosterField,
} from "../../lib/videoDerivedFields";
import { SpacedField } from "../../inputs/SpacedField";
import { VideoFileInput } from "../../inputs/VideoFileInput";
import { createGalleryInput, type AltFromFilename } from "./GalleryInput";
import { GalleryBlockPreview } from "./GalleryBlockPreview";

export type GalleryImage = ImageValue & { _key: string; alt?: string };

export interface GallerySchemaOptions {
  name?: string;
  title?: string;
  fields?: Array<Record<string, unknown>>;
  input?: (props: ArrayOfObjectsInputProps<GalleryImage>) => React.JSX.Element;
  accept?: string;
  altFromFilename?: AltFromFilename;
}

const IMAGE_TYPE = "galleryImage";
const VIDEO_TYPE = "galleryVideo";

function plainThumb(item: unknown) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return undefined;
  return JSON.parse(JSON.stringify(item)) as {
    _key?: string;
    _type?: string;
    asset?: { _ref?: string };
    poster?: { asset?: { _ref?: string } };
  };
}

const defaultFields = [
  {
    name: "alt",
    title: "Alt text",
    type: "string",
    validation: (Rule: any) => Rule.required(),
    components: { field: SpacedField },
  },
  {
    name: "caption",
    title: "Caption",
    type: "string",
    components: { field: SpacedField },
  },
];

function withVideoFields(fields: Array<Record<string, unknown>>) {
  const spaced = fields.map((field) => {
    const components = (field.components ?? {}) as Record<string, unknown>;
    if (components.field) return field;
    return {
      ...field,
      components: { ...components, field: SpacedField },
    };
  });
  const alt = spaced.find((field) => field.name === "alt");
  const rest = spaced.filter((field) => field.name !== "alt");
  return [
    ...(alt ? [alt] : []),
    videoPosterField,
    ...rest,
    ...videoDimensionFields,
  ];
}

export const createGallerySchemaTypes = (options: GallerySchemaOptions = {}) => {
  const galleryName = options.name ?? "gallery";
  const galleryTitle = options.title ?? "Gallery";
  const fields = options.fields ?? defaultFields;
  const input =
    options.input ??
    createGalleryInput({
      accept:
        options.accept ??
        "image/*,.heic,.heif,image/heic,image/heif,video/mp4,video/webm,.mp4,.webm",
      altFromFilename: options.altFromFilename,
    });

  const galleryImage = {
    name: IMAGE_TYPE,
    title: "Gallery Image",
    type: "image",
    options: {
      hotspot: true,
      accept: "image/*,.heic,.heif,image/heic,image/heif",
    },
    fields,
    preview: {
      select: {
        media: "asset",
        title: "alt",
        subtitle: "caption",
      },
      prepare: ({
        media,
        title,
        subtitle,
      }: {
        media?: unknown;
        title?: string;
        subtitle?: string;
      }) => ({
        media,
        title: title || "Untitled image",
        subtitle,
      }),
    },
  };

  const galleryVideo = {
    name: VIDEO_TYPE,
    title: "Gallery Video",
    type: "file",
    options: { accept: "video/mp4,video/webm,.mp4,.webm" },
    components: { input: VideoFileInput },
    fields: withVideoFields(fields),
    validation: maxVideoFileSize,
    preview: {
      select: {
        media: "poster",
        title: "alt",
        subtitle: "caption",
        filename: "asset.originalFilename",
      },
      prepare: ({
        media,
        title,
        subtitle,
        filename,
      }: {
        media?: unknown;
        title?: string;
        subtitle?: string;
        filename?: string;
      }) => ({
        media,
        title: title || filename || "Untitled video",
        subtitle: subtitle || "Video",
      }),
    },
  };

  const columnsField = {
    name: "columns",
    title: "Columns",
    type: "number",
    options: {
      list: [
        { title: "1", value: 1 },
        { title: "2", value: 2 },
        { title: "3", value: 3 },
        { title: "4", value: 4 },
        { title: "5", value: 5 },
        { title: "6", value: 6 },
        { title: "Col per item", value: 0 },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue: 0,
    validation: (Rule: any) => Rule.required().integer().min(0).max(6),
  };

  const imagesField = {
    name: "images",
    title: "Media",
    type: "array",
    components: { input },
    options: {
      layout: "grid",
      sortable: true,
      modal: { type: "dialog", width: 1 },
      disableActions: ["add"],
    },
    of: [{ type: IMAGE_TYPE }, { type: VIDEO_TYPE }],
    validation: (Rule: any) => Rule.min(1),
  };

  const gallery = {
    name: galleryName,
    title: galleryTitle,
    type: "object",
    components: { preview: GalleryBlockPreview },
    fields: [columnsField, imagesField],
    preview: {
      select: {
        columns: "columns",
        t0: "images.0",
        t1: "images.1",
        t2: "images.2",
        t3: "images.3",
        t4: "images.4",
        t5: "images.5",
      },
      prepare: (sel: Record<string, unknown>) => {
        const thumbs = [sel.t0, sel.t1, sel.t2, sel.t3, sel.t4, sel.t5].flatMap(
          (item) => {
            const thumb = plainThumb(item);
            return thumb ? [thumb] : [];
          },
        );
        const columns = sel.columns as number | undefined;
        return {
          title: "Gallery",
          subtitle: `${thumbs.length === 6 ? "6+" : thumbs.length} items · ${
            columns === 0 ? "per item" : `${columns ?? 0} col`
          }`,
          thumbs,
        };
      },
    },
  };

  return [galleryImage, galleryVideo, gallery];
};

export { createGalleryInput };
