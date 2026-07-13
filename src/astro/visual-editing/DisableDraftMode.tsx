import { useIsPresentationTool } from "@sanity/visual-editing/react";

type DraftModeActionsProps = {
  mode?: "draft" | "reenter";
  editHref?: string;
  editLabel?: string;
  exitLabel?: string;
  reenterLabel?: string;
  dismissLabel?: string;
  linkClassName?: string;
};

export function draftModeExitHref(): string {
  if (typeof window === "undefined") return "/api/draft-mode/disable";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/api/draft-mode/disable?redirect=${encodeURIComponent(current)}`;
}

export function draftModeDismissHref(): string {
  if (typeof window === "undefined") return "/api/draft-mode/dismiss";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/api/draft-mode/dismiss?redirect=${encodeURIComponent(current)}`;
}

export function presentationEditUrl(studioUrl: string, previewUrl: string): string {
  const base = studioUrl.replace(/\/$/, "");
  return `${base}/edit?preview=${encodeURIComponent(previewUrl)}`;
}

export default function DraftModeActions({
  mode = "draft",
  editHref,
  editLabel = "Edit",
  exitLabel = "Exit draft mode",
  reenterLabel = "Re-enter preview",
  dismissLabel = "Dismiss",
  linkClassName,
}: DraftModeActionsProps) {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool === true) return null;
  const isReenter = mode === "reenter";
  const secondaryHref = isReenter ? draftModeDismissHref() : draftModeExitHref();
  const primaryLabel = isReenter ? reenterLabel : editLabel;
  const secondaryLabel = isReenter ? dismissLabel : exitLabel;

  return (
    <>
      {editHref ? (
        <a href={editHref} className={linkClassName} data-astro-prefetch="false">
          {primaryLabel}
        </a>
      ) : null}
      <a href={secondaryHref} className={linkClassName} data-astro-prefetch="false">
        {secondaryLabel}
      </a>
    </>
  );
}
