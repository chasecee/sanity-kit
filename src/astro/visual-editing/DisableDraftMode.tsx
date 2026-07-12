import { useIsPresentationTool } from "@sanity/visual-editing/react";

function disableDraftHref(): string {
  if (typeof window === "undefined") return "/api/draft-mode/disable";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/api/draft-mode/disable?redirect=${encodeURIComponent(current)}`;
}

export function presentationEditUrl(studioUrl: string, previewUrl: string): string {
  const base = studioUrl.replace(/\/$/, "");
  return `${base}/edit?preview=${encodeURIComponent(previewUrl)}`;
}

export default function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool === true) return null;

  return (
    <a
      href={disableDraftHref()}
      className="ml-3 underline underline-offset-2 hover:no-underline"
    >
      Exit draft mode
    </a>
  );
}
