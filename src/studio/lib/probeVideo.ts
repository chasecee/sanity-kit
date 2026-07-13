export type ProbedVideo = {
  width: number;
  height: number;
  posterBlob: Blob;
};

const POSTER_MAX_EDGE = 1600;

export function probeVideo(source: File | string): Promise<ProbedVideo | null> {
  return new Promise((resolve) => {
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const shouldRevoke = typeof source !== "string";
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (typeof source === "string") {
      video.crossOrigin = "anonymous";
    }

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      if (shouldRevoke) URL.revokeObjectURL(url);
    };

    const fail = () => {
      cleanup();
      resolve(null);
    };

    const capture = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        fail();
        return;
      }

      const scale = Math.min(1, POSTER_MAX_EDGE / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fail();
        return;
      }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch {
        fail();
        return;
      }
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({ width, height, posterBlob: blob });
        },
        "image/jpeg",
        0.82,
      );
    };

    video.addEventListener(
      "loadeddata",
      () => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          capture();
        };
        video.addEventListener("seeked", onSeeked);
        try {
          const t = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
          if (video.currentTime === t) {
            video.removeEventListener("seeked", onSeeked);
            capture();
          } else {
            video.currentTime = t;
          }
        } catch {
          video.removeEventListener("seeked", onSeeked);
          capture();
        }
      },
      { once: true },
    );
    video.addEventListener("error", fail, { once: true });
    video.src = url;
  });
}
