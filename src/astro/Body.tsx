import React, { useMemo } from "react";
import { PortableText } from "@portabletext/react";
import type {
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from "@portabletext/react";
import type {
  PortableTextBlock,
  ArbitraryTypedObject,
} from "@portabletext/types";
import Columns from "./blocks/Columns";
import Embed from "./blocks/Embed";
import Spotify from "./blocks/Spotify";
import Gallery, { type GalleryImageValue } from "./blocks/Gallery";
import ImageBlock from "./blocks/ImageBlock";
import Media from "./blocks/Media";
import VideoFile from "./blocks/VideoFile";

type DataAttributeResolver = (key: string | undefined) => string | undefined;
type InternalLinkValue = { _type: string; slug?: string; refType?: string };
type ExternalLinkValue = { _type: string; blank?: boolean; href?: string };
type BuildImageUrl = (
  source: unknown,
  options: { width: number; height?: number },
) => string;
type ResolveInternalHref = (value: InternalLinkValue) => string;

const defaultResolveInternalHref: ResolveInternalHref = ({ slug, refType }) => {
  if (!slug) return "#";
  if (refType === "project") return `/projects/${slug}`;
  if (refType === "page") return slug === "home" ? "/" : `/${slug}`;
  if (refType === "music") return `/music/${slug}`;
  return "#";
};

const ExternalLink: React.FC<
  PortableTextMarkComponentProps<ExternalLinkValue>
> = ({ value, children }) => {
  if (!value) return <>{children}</>;

  const { blank, href } = value;

  return blank ? (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="link_external"
    >
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
};

function getKey(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const key = (value as { _key?: unknown })._key;
  return typeof key === "string" ? key : undefined;
}

function createComponents(
  draftMode: boolean,
  buildImageUrl: BuildImageUrl,
  resolveInternalHref: ResolveInternalHref,
  getDataAttribute?: DataAttributeResolver,
): PortableTextComponents {
  const InternalLink: React.FC<PortableTextMarkComponentProps<InternalLinkValue>> = ({
    value,
    children,
  }) => {
    if (!value) return <>{children}</>;
    return <a href={resolveInternalHref(value)}>{children}</a>;
  };

  return {
    block: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value: PortableTextBlock;
    }) => {
      const style =
        value && typeof value === "object" && "style" in value
          ? (value.style as string)
          : "normal";
      const dataSanity = getDataAttribute?.(getKey(value));
      if (style === "h1") return <h1 data-sanity={dataSanity}>{children}</h1>;
      if (style === "h2") return <h2 data-sanity={dataSanity}>{children}</h2>;
      if (style === "h3") return <h3 data-sanity={dataSanity}>{children}</h3>;
      if (style === "h4") return <h4 data-sanity={dataSanity}>{children}</h4>;
      if (style === "blockquote") {
        return <blockquote data-sanity={dataSanity}>{children}</blockquote>;
      }
      return <p data-sanity={dataSanity}>{children}</p>;
    },
    listItem: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value: PortableTextBlock;
    }) => (
      <li data-sanity={getDataAttribute?.(getKey(value))}>{children}</li>
    ),
    marks: {
      internalLink: InternalLink,
      link: ExternalLink,
    },
    types: {
      columns: ({ value }) => {
        const { columns, valign } = value as {
          columns?: { _key: string; content?: PortableTextBlock[] }[];
          valign?: string;
        };
        return (
          <Columns
            columns={columns}
            valign={valign}
            components={createComponents(
              draftMode,
              buildImageUrl,
              resolveInternalHref,
            )}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      embed: ({ value }) => {
        const { url, title, width, aspectRatio, ratio } = value as {
          url?: string;
          title?: string;
          width?: "content" | "full";
          aspectRatio?: string;
          ratio?: { desktop?: string; mobile?: string };
        };
        return (
          <Embed
            url={url}
            title={title}
            width={width}
            aspectRatio={aspectRatio}
            ratio={ratio}
            draftMode={draftMode}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      spotify: ({ value }) => {
        const { url, title, size, theme } = value as {
          url?: string;
          title?: string;
          size?: "compact" | "default";
          theme?: "dark" | "light";
        };
        return (
          <Spotify
            url={url}
            title={title}
            size={size}
            theme={theme}
            draftMode={draftMode}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      gallery: ({ value }) => {
        const { images, columns } = value as {
          images?: GalleryImageValue[];
          columns?: number;
        };
        return (
          <Gallery
            images={images}
            columns={columns}
            draftMode={draftMode}
            buildImageUrl={buildImageUrl}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      image: ({ value }) => {
        if (!value) return null;
        return (
          <ImageBlock
            value={value as Record<string, unknown>}
            draftMode={draftMode}
            buildImageUrl={buildImageUrl}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      media: ({ value }) => (
        <Media
          value={value as { media?: { asset?: { url?: string; mimeType?: string } } }}
          draftMode={draftMode}
          dataSanity={getDataAttribute?.(getKey(value))}
        />
      ),
      videoFile: ({ value }) => (
        <VideoFile
          value={value as { alt?: string; asset?: { url?: string; mimeType?: string } }}
          draftMode={draftMode}
          dataSanity={getDataAttribute?.(getKey(value))}
        />
      ),
    },
  };
}

interface BodyProps {
  value: (PortableTextBlock | ArbitraryTypedObject)[];
  draftMode?: boolean;
  getDataAttribute?: DataAttributeResolver;
  buildImageUrl: BuildImageUrl;
  resolveInternalHref?: ResolveInternalHref;
}

export const Body: React.FC<BodyProps> = ({
  value,
  draftMode = false,
  getDataAttribute,
  buildImageUrl,
  resolveInternalHref = defaultResolveInternalHref,
}) => {
  const components = useMemo(
    () =>
      createComponents(
        draftMode,
        buildImageUrl,
        resolveInternalHref,
        getDataAttribute,
      ),
    [draftMode, buildImageUrl, resolveInternalHref, getDataAttribute],
  );
  return <PortableText value={value} components={components} />;
};

export default Body;
