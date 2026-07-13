import PhotoSwipeLightbox from "photoswipe/lightbox";

let lightbox: PhotoSwipeLightbox | null = null;

const ARROW_SVG =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24" width="24" height="24"><path d="M15.5 3.5 7 12l8.5 8.5 1.4-1.4L9.8 12l7.1-7.1z"/></svg>';

function galleryTileVideos() {
  return Array.from(
    document.querySelectorAll<HTMLVideoElement>("[data-pswp-gallery] video[data-gallery-video]"),
  );
}

function pauseGalleryVideos() {
  for (const video of galleryTileVideos()) {
    video.pause();
  }
}

function resumeGalleryVideos() {
  for (const video of galleryTileVideos()) {
    const rect = video.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      void video.play().catch(() => {});
    }
  }
}

function tileVideoFromAnchor(element: Element | undefined) {
  if (!(element instanceof HTMLElement)) return null;
  return element.querySelector<HTMLVideoElement>("video[data-gallery-video]");
}

function lightboxVideo(container: Element | null | undefined) {
  if (!container) return null;
  return container.querySelector<HTMLVideoElement>("video[data-pswp-video]");
}

function slideVideo(slide: {
  container?: Element | null;
  content?: { element?: Element | null };
} | null | undefined) {
  if (!slide) return null;
  return (
    lightboxVideo(slide.container) ??
    slide.content?.element?.querySelector<HTMLVideoElement>("video[data-pswp-video]") ??
    null
  );
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function playContinuing(video: HTMLVideoElement, startAt: number) {
  const run = () => {
    if (Number.isFinite(startAt) && startAt > 0) {
      try {
        video.currentTime = startAt;
      } catch {
        // ignore seek errors
      }
    }
    video.muted = true;
    void video.play().catch(() => {});
  };

  if (video.readyState >= 1) run();
  else video.addEventListener("loadedmetadata", run, { once: true });
}

function playActiveLightboxVideo(pswp: {
  element?: Element | null;
  currSlide?: {
    container?: Element | null;
    content?: { element?: Element | null };
    data?: { element?: Element };
  } | null;
}) {
  if (!pswp.element) return;
  const current = slideVideo(pswp.currSlide);
  for (const video of pswp.element.querySelectorAll<HTMLVideoElement>(
    "video[data-pswp-video]",
  )) {
    if (video !== current) video.pause();
  }
  if (!current) return;
  if (current.dataset.seeked === "1") {
    if (current.paused) {
      current.muted = true;
      void current.play().catch(() => {});
    }
    return;
  }
  const tile = tileVideoFromAnchor(pswp.currSlide?.data?.element);
  const startAt = tile?.currentTime ?? Number(current.dataset.startAt || 0);
  current.dataset.seeked = "1";
  playContinuing(current, startAt);
}

export const destroyImageGalleryLightbox = () => {
  lightbox?.destroy();
  lightbox = null;
};

const captionFromSlide = (element: Element | undefined) => {
  if (!(element instanceof HTMLElement)) return "";
  return element.dataset.caption?.trim() || "";
};

export const initImageGalleryLightbox = () => {
  destroyImageGalleryLightbox();
  if (!document.querySelector("[data-pswp-gallery]")) return;

  lightbox = new PhotoSwipeLightbox({
    gallery: "body",
    children: "[data-pswp-gallery] a",
    showHideAnimationType: "zoom",
    pswpModule: () => import("photoswipe"),
    paddingFn: (viewportSize) => {
      const inline = viewportSize.x < 768 ? 16 : 48;
      return { top: 48, bottom: 48, left: inline, right: inline };
    },
    initialZoomLevel: "fit",
    secondaryZoomLevel: 1.5,
    maxZoomLevel: 3,
    bgOpacity: 1,
    arrowPrevSVG: ARROW_SVG,
    arrowNextSVG: ARROW_SVG,
    loop: false,
    preload: [1, 2],
  });

  lightbox.addFilter("itemData", (itemData) => {
    const el = itemData.element;
    if (!(el instanceof HTMLElement) || el.dataset.pswpType !== "video") {
      return itemData;
    }
    const src = el.dataset.pswpSrc || el.getAttribute("href") || "";
    const width = Number(el.dataset.pswpWidth) || itemData.w || 1600;
    const height = Number(el.dataset.pswpHeight) || itemData.h || 900;
    const tile = tileVideoFromAnchor(el);
    const startAt = tile?.currentTime ?? 0;
    return {
      ...itemData,
      width,
      height,
      type: "html",
      html: `<div class="pswp__video-wrap" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000"><video data-pswp-video data-start-at="${startAt}" src="${escapeAttr(src)}" muted autoplay loop controls playsinline style="max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain"></video></div>`,
    };
  });

  lightbox.on("beforeOpen", () => {
    pauseGalleryVideos();
    const index = Number(lightbox?.options?.index ?? 0);
    const anchors = document.querySelectorAll("[data-pswp-gallery] a");
    const el = anchors[index];
    const isVideo =
      el instanceof HTMLElement && el.dataset.pswpType === "video";
    if (lightbox) {
      lightbox.options.showHideAnimationType = isVideo ? "fade" : "zoom";
    }
  });

  lightbox.on("change", () => {
    const pswp = lightbox?.pswp;
    if (!pswp) return;
    playActiveLightboxVideo(pswp);
  });

  lightbox.on("appendHeavyContent", ({ slide }) => {
    const pswp = lightbox?.pswp;
    if (!pswp || !slide.isActive) return;
    playActiveLightboxVideo(pswp);
  });

  lightbox.on("close", () => {
    const pswp = lightbox?.pswp;
    const current = slideVideo(pswp?.currSlide);
    const el = pswp?.currSlide?.data?.element;
    const tile = tileVideoFromAnchor(el);
    if (current && tile) {
      try {
        tile.currentTime = current.currentTime;
      } catch {
        // ignore seek errors
      }
    }
  });

  lightbox.on("destroy", () => {
    resumeGalleryVideos();
  });

  lightbox.on("afterInit", () => {
    const pswp = lightbox?.pswp;
    if (!pswp?.element) return;

    let caption = pswp.element.querySelector<HTMLElement>(".pswp__custom-caption");
    if (!caption) {
      caption = document.createElement("div");
      caption.className = "pswp__custom-caption";
      pswp.element.appendChild(caption);
    }

    const update = () => {
      if (!caption) return;
      const text = captionFromSlide(pswp.currSlide?.data?.element);
      caption.textContent = text;
      caption.hidden = !text;
    };

    update();
    pswp.on("change", update);
  });

  lightbox.init();
};
