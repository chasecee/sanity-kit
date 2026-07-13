import { cleanMaybe } from "./utils";

type VideoFileAsset = {
  url?: string;
  mimeType?: string;
};

type VideoFileValue = {
  alt?: string;
  asset?: VideoFileAsset;
};

type VideoFileProps = {
  value?: VideoFileValue;
  draftMode?: boolean;
  dataSanity?: string;
};

export default function VideoFile({
  value,
  draftMode = false,
  dataSanity,
}: VideoFileProps) {
  const src = cleanMaybe(value?.asset?.url || "", draftMode);
  const alt = cleanMaybe(value?.alt || "", draftMode);

  if (!src) return null;

  return (
    <div className="prose-wide not-prose" data-sanity={dataSanity}>
      <video
        className="h-auto w-full"
        controls
        preload="metadata"
        src={src}
        aria-label={alt || undefined}
      />
    </div>
  );
}
