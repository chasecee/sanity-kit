import { cleanMaybe } from "./utils";

type MediaAsset = {
  url?: string;
  mimeType?: string;
  originalFilename?: string;
};

type MediaValue = {
  media?: {
    asset?: MediaAsset;
  };
};

type MediaProps = {
  value?: MediaValue;
  draftMode?: boolean;
  dataSanity?: string;
};

export default function Media({ value, draftMode = false, dataSanity }: MediaProps) {
  const asset = value?.media?.asset;
  const src = cleanMaybe(asset?.url || "", draftMode);
  const mimeType = cleanMaybe(asset?.mimeType || "", draftMode);
  const filename = cleanMaybe(asset?.originalFilename || "media", draftMode);

  if (!src) return null;

  if (mimeType.startsWith("video/")) {
    return (
      <div className="prose-wide not-prose" data-sanity={dataSanity}>
        <video className="h-auto w-full" controls preload="metadata" src={src} />
      </div>
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <div className="prose-wide not-prose" data-sanity={dataSanity}>
        <audio className="w-full" controls preload="metadata" src={src} />
      </div>
    );
  }

  return (
    <p data-sanity={dataSanity}>
      <a href={src} target="_blank" rel="noopener noreferrer">
        {filename}
      </a>
    </p>
  );
}
