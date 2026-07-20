import React, { useId } from "react";
import { imageMasks, type ImageMaskShape } from "./masks";

type ImageMaskProps = {
  value: { image?: unknown; mask?: string };
  buildImageUrl: (source: unknown, options: { width: number; height?: number }) => string;
  dataSanity?: string;
};

const redMatrix = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";

const echoes = [
  { x: "-18%", hue: 0, blur: 4, opacity: 0.7 },
  { x: "18%", hue: 210, blur: 4, opacity: 0.7 },
  { x: "-28%", hue: 60, blur: 9, opacity: 0.5 },
  { x: "28%", hue: 260, blur: 9, opacity: 0.5 },
  { x: "-39%", hue: 120, blur: 14, opacity: 0.35 },
  { x: "39%", hue: 300, blur: 14, opacity: 0.35 },
] as const;

const sheen =
  "conic-gradient(from 210deg at 50% 50%, rgba(255,0,128,0.5), rgba(255,200,0,0.35), rgba(0,255,170,0.45), rgba(0,140,255,0.5), rgba(170,0,255,0.45), rgba(255,0,128,0.5))";

export default function ImageMask({ value, buildImageUrl, dataSanity }: ImageMaskProps) {
  const filterId = useId();
  const imageSrc = buildImageUrl(value.image, { width: 1200, height: 1200 });
  if (!imageSrc) return null;

  const mask = (value.mask as ImageMaskShape) || "triangle";
  const clipPath = imageMasks[mask] ?? imageMasks.triangle;
  const alt = (value.image as { alt?: string })?.alt ?? "";

  return (
    <div data-sanity={dataSanity} className="relative mx-auto max-w-[400px]">
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
            <feColorMatrix in="SourceGraphic" type="matrix" values={redMatrix} result="tint" />
            <feDisplacementMap in="tint" in2="noise" scale="14" />
          </filter>
        </defs>
      </svg>
      <div className="relative w-full overflow-hidden pb-[100%]" style={{ clipPath }}>
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: sheen, mixBlendMode: "overlay", opacity: 0.5 }}
        />
      </div>
      {echoes.map((echo, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translateX(${echo.x})`,
            filter: `url(#${filterId}) hue-rotate(${echo.hue}deg) saturate(1.6) blur(${echo.blur}px)`,
            opacity: echo.opacity,
            mixBlendMode: "screen",
          }}
        >
          <div className="relative w-full overflow-hidden pb-[100%]" style={{ clipPath }}>
            <img
              src={imageSrc}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
