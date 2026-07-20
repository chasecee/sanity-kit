import { imageMasks, type ImageMaskShape } from "./masks";

type ImageMaskProps = {
  value: { image?: unknown; mask?: string };
  buildImageUrl: (source: unknown, options: { width: number; height?: number }) => string;
  dataSanity?: string;
};

export default function ImageMask({ value, buildImageUrl, dataSanity }: ImageMaskProps) {
  const imageSrc = buildImageUrl(value.image, { width: 1200, height: 1200 });
  if (!imageSrc) return null;

  const mask = (value.mask as ImageMaskShape) || "triangle";
  const clipPath = imageMasks[mask] ?? imageMasks.triangle;
  const alt = (value.image as { alt?: string })?.alt ?? "";

  return (
    <div data-sanity={dataSanity} className="mx-auto max-w-[400px]">
      <div
        className="relative w-full overflow-hidden pb-[100%]"
        style={{ clipPath }}
      >
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
