import { useEffect, useRef } from "react";
import { useToast } from "@sanity/ui";
import { set, useClient, type ObjectInputProps } from "sanity";
import { STUDIO_API_VERSION } from "../lib/maxVideoFileSize";
import { enrichVideoFromUrl, uploadVideoWithProbe } from "../lib/uploadVideoWithProbe";

type VideoFileValue = {
  _type?: string;
  asset?: {
    _type?: "reference";
    _ref?: string;
  };
  alt?: string;
  width?: number;
  height?: number;
  poster?: {
    _type?: "image";
    asset?: {
      _type?: "reference";
      _ref?: string;
    };
  };
};

const isVideoFile = (file: File) =>
  file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name);

export function VideoFileInput(props: ObjectInputProps<VideoFileValue>) {
  const { value, onChange, readOnly, renderDefault } = props;
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const toast = useToast();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const doneForRef = useRef<string | null>(null);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || readOnly) return;

    const onFileChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
      const file = input.files?.[0];
      if (!file || !isVideoFile(file) || busyRef.current) return;

      event.stopPropagation();
      event.preventDefault();
      busyRef.current = true;

      void (async () => {
        try {
          const uploaded = await uploadVideoWithProbe(client, file);
          doneForRef.current = uploaded.assetId;
          const { width: _w, height: _h, poster: _p, ...rest } = value ?? {};
          onChange(
            set({
              ...rest,
              asset: { _type: "reference", _ref: uploaded.assetId },
              ...(uploaded.width ? { width: uploaded.width } : {}),
              ...(uploaded.height ? { height: uploaded.height } : {}),
              ...(uploaded.poster ? { poster: uploaded.poster } : {}),
            }),
          );
        } catch (error) {
          doneForRef.current = null;
          toast.push({
            status: "error",
            title: "Video upload failed",
            description:
              error instanceof Error ? error.message : "Could not upload video",
          });
        } finally {
          busyRef.current = false;
          input.value = "";
        }
      })();
    };

    root.addEventListener("change", onFileChange, true);
    return () => root.removeEventListener("change", onFileChange, true);
  }, [client, onChange, readOnly, toast, value]);

  useEffect(() => {
    const assetRef = value?.asset?._ref;
    if (!assetRef) {
      doneForRef.current = null;
      return;
    }
    if (readOnly || busyRef.current) return;
    if (value?.width && value?.height && value?.poster?.asset?._ref) return;
    if (doneForRef.current === assetRef) return;

    busyRef.current = true;

    void (async () => {
      try {
        const url = await client.fetch<string | null>(`*[_id == $id][0].url`, {
          id: assetRef,
        });
        if (!url) {
          doneForRef.current = null;
          return;
        }

        const enriched = await enrichVideoFromUrl(client, url);
        if (!enriched.probed) {
          doneForRef.current = null;
          toast.push({
            status: "warning",
            title: "Could not generate poster",
            description: "Open the video again or replace the poster manually.",
          });
          return;
        }

        doneForRef.current = assetRef;
        const { width: _w, height: _h, poster: _p, ...rest } = value ?? {};
        onChange(
          set({
            ...rest,
            asset: value?.asset,
            ...(enriched.width ? { width: enriched.width } : {}),
            ...(enriched.height ? { height: enriched.height } : {}),
            ...(enriched.poster ? { poster: enriched.poster } : {}),
          }),
        );
      } catch (error) {
        doneForRef.current = null;
        toast.push({
          status: "error",
          title: "Video enrich failed",
          description:
            error instanceof Error ? error.message : "Could not prepare poster",
        });
      } finally {
        busyRef.current = false;
      }
    })();
  }, [
    client,
    onChange,
    readOnly,
    toast,
    value?.asset?._ref,
    value?.height,
    value?.poster?.asset?._ref,
    value?.width,
    value,
  ]);

  return <div ref={wrapRef}>{renderDefault(props)}</div>;
}
