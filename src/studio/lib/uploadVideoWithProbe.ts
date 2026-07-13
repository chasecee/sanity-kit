import type { SanityClient } from "@sanity/client";
import { assertVideoFileSize } from "./maxVideoFileSize";
import { probeVideo, type ProbedVideo } from "./probeVideo";

export type VideoUploadResult = {
  assetId: string;
  width?: number;
  height?: number;
  poster?: {
    _type: "image";
    asset: { _type: "reference"; _ref: string };
  };
  probed: ProbedVideo | null;
};

function posterFilename(name: string) {
  const base = name.replace(/\.[^/.]+$/, "") || "video";
  return `${base}-poster.jpg`;
}

export function posterImageValue(assetId: string) {
  return {
    _type: "image" as const,
    asset: {
      _type: "reference" as const,
      _ref: assetId,
    },
  };
}

export async function uploadVideoWithProbe(
  client: SanityClient,
  file: File,
): Promise<VideoUploadResult> {
  assertVideoFileSize(file);
  const probed = await probeVideo(file);
  const [asset, posterAsset] = await Promise.all([
    client.assets.upload("file", file, { filename: file.name }),
    probed
      ? client.assets.upload("image", probed.posterBlob, {
          filename: posterFilename(file.name),
        })
      : Promise.resolve(null),
  ]);

  return {
    assetId: asset._id,
    probed,
    ...(probed
      ? {
          width: probed.width,
          height: probed.height,
        }
      : {}),
    ...(posterAsset ? { poster: posterImageValue(posterAsset._id) } : {}),
  };
}

export async function enrichVideoFromUrl(
  client: SanityClient,
  url: string,
  filename = "video-poster.jpg",
): Promise<Pick<VideoUploadResult, "width" | "height" | "poster" | "probed">> {
  const probed = await probeVideo(url);
  if (!probed) return { probed: null };

  const posterAsset = await client.assets.upload("image", probed.posterBlob, {
    filename,
  });

  return {
    probed,
    width: probed.width,
    height: probed.height,
    poster: posterImageValue(posterAsset._id),
  };
}
