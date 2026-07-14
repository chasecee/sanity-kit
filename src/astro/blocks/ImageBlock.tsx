import type { CSSProperties } from "react";
import { cleanMaybe } from "./utils";

type AssetRef = {
  _ref?: string;
  _id?: string;
  metadata?: {
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
};

type ImageBlockProps = {
  value: Record<string, unknown>;
  draftMode: boolean;
  dataSanity?: string;
  buildImageUrl: (source: unknown, options: { width: number; height: number }) => string;
};

export default function ImageBlock({
  value,
  draftMode,
  dataSanity,
  buildImageUrl,
}: ImageBlockProps) {
  const asset = value.asset as AssetRef | undefined;
  let width = asset?.metadata?.dimensions?.width;
  let height = asset?.metadata?.dimensions?.height;

  if ((!width || !height) && (asset?._ref || asset?._id)) {
    const ref = asset._ref || asset._id || "";
    const parts = ref.split("-");
    if (parts.length >= 3) {
      const [w, h] = parts[2].split("x").map((item) => parseInt(item, 10));
      if (!Number.isNaN(w) && !Number.isNaN(h)) {
        width = w;
        height = h;
      }
    }
  }

  const finalWidth = width ?? 800;
  const finalHeight = height ?? 600;
  const rawImageSrc = buildImageUrl(value, { width: finalWidth, height: finalHeight });
  const imageSrc = cleanMaybe(rawImageSrc, draftMode);
  const imageAlt = cleanMaybe((value.alt as string) || "", draftMode);

  return (
    <img
      src={imageSrc}
      alt={imageAlt}
      width={finalWidth}
      height={finalHeight}
      className="measure-fit max-w-full"
      style={{ "--media-ar": finalWidth / finalHeight } as CSSProperties}
      data-sanity={dataSanity}
    />
  );
}
