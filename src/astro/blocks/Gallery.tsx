import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { cleanMaybe } from "./utils";

type AssetRef = {
  _ref?: string;
  _id?: string;
  url?: string;
  mimeType?: string;
  metadata?: {
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
};

type ImageCrop = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type GalleryImageValue = {
  _key?: string;
  _type?: string;
  asset?: AssetRef;
  crop?: ImageCrop;
  alt?: string;
  caption?: string;
  url?: string;
  width?: number;
  height?: number;
  poster?: {
    asset?: AssetRef;
    [key: string]: unknown;
  };
};

type GalleryProps = {
  images?: GalleryImageValue[];
  columns?: number;
  draftMode?: boolean;
  dataSanity?: string;
  buildImageUrl: (source: unknown, options: { width: number; height?: number }) => string;
};

type Size = { width: number; height: number };

const DEFAULT_VIDEO_SIZE: Size = { width: 1600, height: 900 };

function isGalleryVideo(item: GalleryImageValue) {
  return item._type === "galleryVideo";
}

function sourceDimensions(image: GalleryImageValue): Size {
  const meta = image.asset?.metadata?.dimensions;
  if (meta?.width && meta?.height) {
    return { width: meta.width, height: meta.height };
  }

  const ref = image.asset?._ref || image.asset?._id || "";
  const parts = ref.split("-");
  if (parts.length >= 3) {
    const [w, h] = parts[2].split("x").map((item) => Number.parseInt(item, 10));
    if (Number.isFinite(w) && Number.isFinite(h)) return { width: w, height: h };
  }

  return { width: 1600, height: 1600 };
}

function imageDimensions(image: GalleryImageValue): Size {
  const { width, height } = sourceDimensions(image);
  const crop = image.crop;
  if (!crop) return { width, height };

  const croppedWidth = width * (1 - (crop.left ?? 0) - (crop.right ?? 0));
  const croppedHeight = height * (1 - (crop.top ?? 0) - (crop.bottom ?? 0));
  return {
    width: Math.max(1, Math.round(croppedWidth)),
    height: Math.max(1, Math.round(croppedHeight)),
  };
}

function storedVideoSize(item: GalleryImageValue): Size | null {
  if (
    typeof item.width === "number" &&
    typeof item.height === "number" &&
    item.width > 0 &&
    item.height > 0
  ) {
    return { width: item.width, height: item.height };
  }
  return null;
}

function itemSize(item: GalleryImageValue, videoSizes: Record<string, Size>): Size {
  if (!isGalleryVideo(item)) return imageDimensions(item);
  const stored = storedVideoSize(item);
  if (stored) return stored;
  const key = item._key || item.asset?.url || "";
  return (key && videoSizes[key]) || DEFAULT_VIDEO_SIZE;
}

function GalleryVideoTile({
  item,
  draftMode,
  size,
  posterUrl,
  onSize,
}: {
  item: GalleryImageValue;
  draftMode: boolean;
  size: Size;
  posterUrl: string;
  onSize: (key: string, size: Size) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const src = cleanMaybe(item.asset?.url || "", draftMode);
  const alt = cleanMaybe(item.alt || "", draftMode);
  const caption = cleanMaybe(item.caption || "", draftMode);
  const key = item._key || src;
  const hasStoredSize = Boolean(storedVideoSize(item));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "100px 0px", threshold: 0.01 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  if (!src) return null;

  return (
    <figure className="m-0">
      <a
        href={src}
        className="block"
        data-pswp-src={src}
        data-pswp-width={size.width}
        data-pswp-height={size.height}
        data-pswp-type="video"
        data-caption={caption || undefined}
      >
        <video
          ref={videoRef}
          className="h-auto w-full"
          style={{ aspectRatio: `${size.width} / ${size.height}` }}
          width={size.width}
          height={size.height}
          src={src}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload={posterUrl ? "metadata" : "auto"}
          aria-label={alt || undefined}
          data-gallery-video
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (!video.videoWidth || !video.videoHeight) return;
            if (!hasStoredSize) {
              onSize(key, { width: video.videoWidth, height: video.videoHeight });
              const anchor = video.closest("a");
              if (anchor instanceof HTMLElement) {
                anchor.dataset.pswpWidth = String(video.videoWidth);
                anchor.dataset.pswpHeight = String(video.videoHeight);
              }
            }
            void video.play().catch(() => {});
          }}
        />
      </a>
      {caption ? (
        <figcaption className="my-2 text-xs opacity-50">
          <em>{caption}</em>
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function Gallery({
  images,
  columns = 0,
  draftMode = false,
  dataSanity,
  buildImageUrl,
}: GalleryProps) {
  const [videoSizes, setVideoSizes] = useState<Record<string, Size>>({});

  const onVideoSize = useCallback((key: string, size: Size) => {
    setVideoSizes((prev) => {
      const existing = prev[key];
      if (existing && existing.width === size.width && existing.height === size.height) {
        return prev;
      }
      return { ...prev, [key]: size };
    });
  }, []);

  useEffect(() => {
    document.dispatchEvent(new Event("gallery:mount"));
  }, [images]);

  if (!images?.length) return null;

  const safeColumns = Number.isInteger(columns)
    ? Math.min(6, Math.max(0, columns))
    : 0;
  const desktopColumns = safeColumns === 0 ? images.length : safeColumns;

  const rows: GalleryImageValue[][] = [];
  for (let i = 0; i < images.length; i += desktopColumns) {
    rows.push(images.slice(i, i + desktopColumns));
  }

  return (
    <div
      className="prose-wide not-prose flex flex-col gap-3"
      data-pswp-gallery
      data-sanity={dataSanity}
    >
      <style>{`
        @media (width >= 640px) {
          [data-pswp-gallery] > [data-gallery-row] {
            grid-template-columns: var(--row-cols);
          }
        }
      `}</style>
      {rows.map((row, rowIndex) => {
        const template = row
          .map((item) => {
            const { width, height } = itemSize(item, videoSizes);
            return `${(width / height).toFixed(4)}fr`;
          })
          .join(" ");

        return (
          <div
            key={row[0]?._key || `row-${rowIndex}`}
            data-gallery-row
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{ "--row-cols": template } as CSSProperties}
          >
            {row.map((item) => {
              if (isGalleryVideo(item)) {
                const size = itemSize(item, videoSizes);
                const posterUrl = item.poster
                  ? cleanMaybe(buildImageUrl(item.poster, { width: 1400 }), draftMode)
                  : "";
                return (
                  <GalleryVideoTile
                    key={item._key || item.asset?.url}
                    item={item}
                    draftMode={draftMode}
                    size={size}
                    posterUrl={posterUrl}
                    onSize={onVideoSize}
                  />
                );
              }

              const { width, height } = imageDimensions(item);
              const thumb = item.url
                ? cleanMaybe(item.url, draftMode)
                : item.asset
                  ? buildImageUrl(item, { width: 1400 })
                  : "";
              const full = item.url
                ? cleanMaybe(item.url, draftMode)
                : item.asset
                  ? buildImageUrl(item, { width: 2400 })
                  : "";
              if (!thumb || !full) return null;

              const alt = cleanMaybe(item.alt || "", draftMode);
              const caption = cleanMaybe(item.caption || "", draftMode);

              return (
                <figure key={item._key || full} className="m-0">
                  <a
                    href={full}
                    className="block"
                    data-pswp-src={full}
                    data-pswp-width={width}
                    data-pswp-height={height}
                    data-caption={caption || undefined}
                    data-cropped="true"
                  >
                    <img
                      src={thumb}
                      alt={alt}
                      width={width}
                      height={height}
                      className="h-auto w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                  {caption ? (
                    <figcaption className="my-2 text-xs opacity-50">
                      <em>{caption}</em>
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
