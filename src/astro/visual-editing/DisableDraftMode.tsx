import { useIsPresentationTool } from "@sanity/visual-editing/react";

type DraftModeActionsProps = {
  editHref?: string;
  editLabel?: string;
  exitLabel?: string;
  linkClassName?: string;
};

export function draftModeExitHref(): string {
  if (typeof window === "undefined") return "/api/draft-mode/disable";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/api/draft-mode/disable?redirect=${encodeURIComponent(current)}`;
}

export function presentationEditUrl(studioUrl: string, previewUrl: string): string {
  const base = studioUrl.replace(/\/$/, "");
  return `${base}/edit?preview=${encodeURIComponent(previewUrl)}`;
}

export default function DraftModeActions({
  editHref,
  editLabel = "Edit",
  exitLabel = "Exit draft mode",
  linkClassName,
}: DraftModeActionsProps) {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool === true) return null;
  const exitHref = draftModeExitHref();

  return (
    <>
      {editHref ? (
        <a href={editHref} className={linkClassName}>
          {editLabel}
        </a>
      ) : null}
      <a href={exitHref} className={linkClassName}>
        {exitLabel}
      </a>
    </>
  );
}
