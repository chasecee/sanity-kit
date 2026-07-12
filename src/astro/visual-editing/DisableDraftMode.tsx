import { useIsPresentationTool } from "@sanity/visual-editing/react";

type DisableDraftModeProps = {
  studioUrl: string;
};

function disableDraftHref(): string {
  if (typeof window === "undefined") return "/api/draft-mode/disable";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/api/draft-mode/disable?redirect=${encodeURIComponent(current)}`;
}

function editHref(studioUrl: string): string {
  const base = studioUrl.replace(/\/$/, "");
  return `${base}/edit?preview=${encodeURIComponent(window.location.href)}`;
}

export default function DisableDraftMode({ studioUrl }: DisableDraftModeProps) {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool === true) return null;

  return (
    <>
      <a
        href={editHref(studioUrl)}
        className="ml-3 underline underline-offset-2 hover:no-underline"
      >
        Edit
      </a>
      <a
        href={disableDraftHref()}
        className="ml-3 underline underline-offset-2 hover:no-underline"
      >
        Exit draft mode
      </a>
    </>
  );
}
