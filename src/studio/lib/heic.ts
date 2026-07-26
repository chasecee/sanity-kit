import {
  createClient,
  type ClientConfig,
  type SanityClient,
  type UploadBody,
  type UploadClientConfig,
} from "@sanity/client";
import { Observable } from "rxjs";

const HEIC_PATCHED = Symbol.for("chasecee.heicPatched");

export const isHeic = (file: File) =>
  /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

export async function convertHeic(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const nextName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], nextName, { type: "image/jpeg" });
}

export async function ensureUploadableImage(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  return convertHeic(file);
}

async function normalizeImageUpload(
  assetType: "image" | "file",
  body: UploadBody,
  options?: UploadClientConfig,
): Promise<{ body: UploadBody; options?: UploadClientConfig }> {
  if (assetType !== "image" || !(body instanceof File) || !isHeic(body)) {
    return { body, options };
  }
  const converted = await convertHeic(body);
  return {
    body: converted,
    options: { ...options, filename: converted.name },
  };
}

export function wrapClientForHeic(client: SanityClient): SanityClient {
  const assets = client.assets as SanityClient["assets"] & {
    [HEIC_PATCHED]?: boolean;
  };
  if (assets[HEIC_PATCHED]) return client;

  const upload = client.assets.upload.bind(client.assets);
  client.assets.upload = (async (assetType, body, options) => {
    const next = await normalizeImageUpload(assetType, body, options);
    return upload(assetType, next.body, next.options);
  }) as typeof client.assets.upload;

  const observableUpload = client.observable.assets.upload.bind(
    client.observable.assets,
  );
  client.observable.assets.upload = ((assetType, body, options) =>
    new Observable((subscriber) => {
      let inner: { unsubscribe: () => void } | undefined;
      let cancelled = false;
      void normalizeImageUpload(assetType, body, options).then(
        (next) => {
          if (cancelled) return;
          inner = observableUpload(
            assetType,
            next.body,
            next.options,
          ).subscribe(subscriber);
        },
        (error) => {
          subscriber.error(error);
        },
      );
      return () => {
        cancelled = true;
        inner?.unsubscribe();
      };
    })) as typeof client.observable.assets.upload;

  assets[HEIC_PATCHED] = true;

  const originalWithConfig = client.withConfig.bind(client);
  client.withConfig = ((newConfig) =>
    wrapClientForHeic(originalWithConfig(newConfig))) as typeof client.withConfig;

  return client;
}

export function createHeicAwareClient(config: ClientConfig): SanityClient {
  return wrapClientForHeic(createClient(config));
}

type ImageUploadClient = {
  assets: {
    upload: (
      type: "image",
      body: UploadBody,
      options?: UploadClientConfig,
    ) => Promise<{ _id: string; originalFilename?: string | null }>;
  };
};

export async function uploadImageAsset(
  client: ImageUploadClient,
  file: File,
  options?: UploadClientConfig,
) {
  const next = await ensureUploadableImage(file);
  return client.assets.upload("image", next, {
    ...options,
    filename: options?.filename ?? next.name,
  });
}
