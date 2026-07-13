import { useRef, useState, type ChangeEvent, type ComponentType } from "react";
import { SearchIcon } from "@sanity/icons/Search";
import { UploadIcon } from "@sanity/icons/Upload";
import { Button, Flex, Menu, MenuButton, MenuItem, useToast } from "@sanity/ui";
import {
  type ArrayInputFunctionsProps,
  type ArrayOfObjectsInputProps,
  type ImageValue,
  useClient,
  useSource,
} from "sanity";
import { STUDIO_API_VERSION } from "../../lib/maxVideoFileSize";
import {
  enrichVideoFromUrl,
  uploadVideoWithProbe,
} from "../../lib/uploadVideoWithProbe";

export type GalleryImage = ImageValue & { _key: string; alt?: string };

export type AltFromFilename = (filename: string) => string;

export interface GalleryInputOptions {
  accept?: string;
  altFromFilename?: AltFromFilename;
}

type AssetSourceLike = {
  name: string;
  title?: string;
  component: ComponentType<Record<string, unknown>>;
  icon?: ComponentType;
};

type AssetFromSourceLike = {
  kind: string;
  value: string | File;
  assetDocumentProps?: {
    originalFilename?: string;
  };
};

type BrowseState = {
  source: AssetSourceLike;
  assetType: "image" | "file";
};

const IMAGE_TYPE = "galleryImage";
const VIDEO_TYPE = "galleryVideo";

const defaultNewKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const defaultAltFromFilename: AltFromFilename = (name) => {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim() || "Media";
};

const isVideoFile = (file: File) =>
  file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name);

const isVideoAsset = (mimeType?: string, filename?: string) =>
  Boolean(
    mimeType?.startsWith("video/") ||
      (filename && /\.(mp4|webm)$/i.test(filename)),
  );

export const createGalleryInput = (options: GalleryInputOptions = {}) => {
  const accept = options.accept ?? "image/*,video/mp4,video/webm,.mp4,.webm";
  const altFromFilename = options.altFromFilename ?? defaultAltFromFilename;

  function GalleryArrayFunctions(
    props: ArrayInputFunctionsProps<
      GalleryImage,
      ArrayOfObjectsInputProps["schemaType"]
    >,
  ) {
    const { readOnly, schemaType, onItemAppend } = props;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState("");
    const [browse, setBrowse] = useState<BrowseState | null>(null);
    const client = useClient({ apiVersion: STUDIO_API_VERSION });
    const toast = useToast();
    const { image, file } = useSource().form;
    const imageSources = (image.assetSources ?? []) as AssetSourceLike[];
    const fileSources = (file.assetSources ?? []) as AssetSourceLike[];

    const typeByName = (name: string) =>
      schemaType.of.find((item) => item.name === name);

    const uploadFiles = async (files: File[]) => {
      if (readOnly) return;
      const media = files.filter(
        (item) => item.type.startsWith("image/") || isVideoFile(item),
      );
      if (!media.length) return;

      setUploading(true);
      try {
        for (let i = 0; i < media.length; i += 1) {
          const mediaFile = media[i];
          const label = `${i + 1}/${media.length}`;
          const video = isVideoFile(mediaFile);
          const itemType = typeByName(video ? VIDEO_TYPE : IMAGE_TYPE);
          if (!itemType) continue;

          if (video) {
            setStatus(`Uploading ${label}`);
            const uploaded = await uploadVideoWithProbe(client, mediaFile);
            onItemAppend({
              _key: defaultNewKey(),
              _type: itemType.name,
              asset: { _type: "reference", _ref: uploaded.assetId },
              alt: altFromFilename(mediaFile.name),
              ...(uploaded.width ? { width: uploaded.width } : {}),
              ...(uploaded.height ? { height: uploaded.height } : {}),
              ...(uploaded.poster ? { poster: uploaded.poster } : {}),
            });
            continue;
          }

          setStatus(`Uploading ${label}`);
          const asset = await client.assets.upload("image", mediaFile, {
            filename: mediaFile.name,
          });
          onItemAppend({
            _key: defaultNewKey(),
            _type: itemType.name,
            asset: { _type: "reference", _ref: asset._id },
            alt: altFromFilename(mediaFile.name),
          });
        }
      } catch (error) {
        toast.push({
          status: "error",
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Could not upload media",
        });
      } finally {
        setUploading(false);
        setStatus("");
      }
    };

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length) void uploadFiles(files);
      event.target.value = "";
    };

    const appendSelectedAssets = async (
      assets: AssetFromSourceLike[],
      assetType: "image" | "file",
    ) => {
      try {
        for (const asset of assets) {
          if (asset.kind !== "assetDocumentId" || typeof asset.value !== "string") {
            continue;
          }

          if (assetType === "image") {
            const itemType = typeByName(IMAGE_TYPE);
            if (!itemType) continue;
            const filename =
              asset.assetDocumentProps?.originalFilename || "Image";
            onItemAppend({
              _key: defaultNewKey(),
              _type: itemType.name,
              asset: { _type: "reference", _ref: asset.value },
              alt: altFromFilename(filename),
            });
            continue;
          }

          const itemType = typeByName(VIDEO_TYPE);
          if (!itemType) continue;

          const doc = await client.fetch<{
            url?: string;
            originalFilename?: string;
            mimeType?: string;
          } | null>(`*[_id == $id][0]{url, originalFilename, mimeType}`, {
            id: asset.value,
          });
          if (!doc || !isVideoAsset(doc.mimeType, doc.originalFilename)) {
            toast.push({
              status: "warning",
              title: "Not a video",
              description: "Select an mp4 or webm file.",
            });
            continue;
          }

          const filename = doc.originalFilename || "Video";
          let width: number | undefined;
          let height: number | undefined;
          let poster:
            | {
                _type: "image";
                asset: { _type: "reference"; _ref: string };
              }
            | undefined;

          if (doc.url) {
            setStatus("Preparing poster");
            setUploading(true);
            try {
              const enriched = await enrichVideoFromUrl(
                client,
                doc.url,
                `${filename.replace(/\.[^/.]+$/, "") || "video"}-poster.jpg`,
              );
              if (!enriched.probed) {
                toast.push({
                  status: "warning",
                  title: "Could not generate poster",
                  description: "Video added without a poster.",
                });
              }
              width = enriched.width;
              height = enriched.height;
              poster = enriched.poster;
            } finally {
              setUploading(false);
              setStatus("");
            }
          }

          onItemAppend({
            _key: defaultNewKey(),
            _type: itemType.name,
            asset: { _type: "reference", _ref: asset.value },
            alt: altFromFilename(filename),
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
            ...(poster ? { poster } : {}),
          });
        }
      } catch (error) {
        toast.push({
          status: "error",
          title: "Select failed",
          description:
            error instanceof Error ? error.message : "Could not add media",
        });
      }
    };

    const onAssetSelect = (assets: AssetFromSourceLike[]) => {
      const assetType = browse?.assetType;
      setBrowse(null);
      if (!assetType || readOnly) return;
      void appendSelectedAssets(assets, assetType);
    };

    if (readOnly) return null;

    const selectItems = [
      ...imageSources.map((source) => ({
        key: `image:${source.name}`,
        source,
        assetType: "image" as const,
        title:
          imageSources.length + fileSources.length > 1
            ? `Image · ${source.title || source.name}`
            : source.title || "Select",
      })),
      ...fileSources.map((source) => ({
        key: `file:${source.name}`,
        source,
        assetType: "file" as const,
        title:
          imageSources.length + fileSources.length > 1
            ? `Video · ${source.title || source.name}`
            : source.title || "Select",
      })),
    ];

    const selectButton =
      selectItems.length === 0 ? null : selectItems.length === 1 ? (
        <Button
          icon={SearchIcon}
          mode="ghost"
          padding={3}
          fontSize={1}
          text="Select"
          disabled={uploading}
          onClick={() =>
            setBrowse({
              source: selectItems[0].source,
              assetType: selectItems[0].assetType,
            })
          }
        />
      ) : (
        <MenuButton
          id="gallery-select-asset"
          button={
            <Button
              icon={SearchIcon}
              mode="ghost"
              padding={3}
              fontSize={1}
              text="Select"
              disabled={uploading}
            />
          }
          menu={
            <Menu>
              {selectItems.map((item) => (
                <MenuItem
                  key={item.key}
                  text={item.title}
                  icon={item.source.icon}
                  onClick={() =>
                    setBrowse({
                      source: item.source,
                      assetType: item.assetType,
                    })
                  }
                />
              ))}
            </Menu>
          }
          popover={{ portal: true, placement: "bottom-start" }}
        />
      );

    const BrowseComponent = browse?.source.component;

    return (
      <>
        <Flex gap={1}>
          <Button
            icon={UploadIcon}
            mode="ghost"
            padding={3}
            fontSize={1}
            text={uploading ? status || "Upload" : "Upload"}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          />
          {selectButton}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={onFileChange}
            hidden
          />
        </Flex>
        {browse && BrowseComponent ? (
          <BrowseComponent
            assetSource={browse.source}
            assetType={browse.assetType}
            accept={
              browse.assetType === "image"
                ? "image/*"
                : "video/mp4,video/webm,.mp4,.webm"
            }
            selectionType="single"
            selectedAssets={[]}
            dialogHeaderTitle={
              browse.assetType === "image" ? "Select image" : "Select video"
            }
            onClose={() => setBrowse(null)}
            onSelect={onAssetSelect}
          />
        ) : null}
      </>
    );
  }

  return function GalleryInput(props: ArrayOfObjectsInputProps<GalleryImage>) {
    return props.renderDefault({
      ...props,
      arrayFunctions: GalleryArrayFunctions,
    });
  };
};
