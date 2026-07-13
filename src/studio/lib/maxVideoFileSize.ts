export const MAX_VIDEO_BYTES = 100_000_000;
export const STUDIO_API_VERSION = "2025-01-01";

export function assertVideoFileSize(file: File) {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be 100MB or smaller");
  }
}

export const maxVideoFileSize = (Rule: any) =>
  Rule.custom(async (value: { asset?: { _ref?: string } } | undefined, context: any) => {
    const ref = value?.asset?._ref;
    if (!ref) return true;
    const client = context.getClient({ apiVersion: STUDIO_API_VERSION });
    const size = await client.fetch(`*[_id == $id][0].size`, { id: ref });
    if (typeof size === "number" && size > MAX_VIDEO_BYTES) {
      return "Video must be 100MB or smaller";
    }
    return true;
  });
