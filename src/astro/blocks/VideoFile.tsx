import { cleanMaybe } from "./utils";

type VideoFileAsset = {
  url?: string;
  mimeType?: string;
};

type VideoFileValue = {
  alt?: string;
  width?: number;
  height?: number;
  asset?: VideoFileAsset;
  poster?: {
    asset?: {
      url?: string;
    };
  };
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
  const poster = cleanMaybe(value?.poster?.asset?.url || "", draftMode);
  const width = value?.width && value.width > 0 ? value.width : undefined;
  const height = value?.height && value.height > 0 ? value.height : undefined;

  if (!src) return null;

  return (
    <video
      className="mx-auto h-auto max-w-full"
      style={
        width && height
          ? { aspectRatio: `${width} / ${height}` }
          : undefined
      }
      width={width}
      height={height}
      controls
      preload="metadata"
      src={src}
      poster={poster || undefined}
      aria-label={alt || undefined}
      data-sanity={dataSanity}
    />
  );
}
