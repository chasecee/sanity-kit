import { useEffect, useRef } from "react";
import { useToast } from "@sanity/ui";
import { type InputProps } from "sanity";
import { ensureUploadableImage, isHeic } from "../lib/heic";

function isImageSchemaType(schemaType: InputProps["schemaType"]) {
  let current: { name?: string; type?: { name?: string } } | undefined =
    schemaType;
  while (current) {
    if (current.name === "image") return true;
    current = current.type;
  }
  return false;
}

export function HeicImageInput(props: InputProps) {
  if (!isImageSchemaType(props.schemaType)) {
    return props.renderDefault(props);
  }

  return <HeicImageInputInner {...props} />;
}

function HeicImageInputInner(props: InputProps) {
  const { readOnly, renderDefault } = props;
  const toast = useToast();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || readOnly) return;

    const onFileChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
      const files = Array.from(input.files ?? []);
      if (!files.length || !files.some(isHeic) || busyRef.current) return;

      event.stopPropagation();
      event.preventDefault();
      busyRef.current = true;

      void (async () => {
        try {
          const converted = await Promise.all(
            files.map((file) => ensureUploadableImage(file)),
          );
          const transfer = new DataTransfer();
          for (const file of converted) transfer.items.add(file);
          input.files = transfer.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (error) {
          toast.push({
            status: "error",
            title: "HEIC conversion failed",
            description:
              error instanceof Error
                ? error.message
                : "Could not convert HEIC image",
          });
        } finally {
          busyRef.current = false;
        }
      })();
    };

    root.addEventListener("change", onFileChange, true);
    return () => root.removeEventListener("change", onFileChange, true);
  }, [readOnly, toast]);

  return <div ref={wrapRef}>{renderDefault(props)}</div>;
}
