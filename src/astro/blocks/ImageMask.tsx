import React, { useId } from "react";
import { imageMasks, type ImageMaskShape } from "./masks";

type ImageMaskProps = {
  value: { image?: unknown; mask?: string };
  buildImageUrl: (source: unknown, options: { width: number; height?: number }) => string;
  dataSanity?: string;
};

const channelMatrices = {
  r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
} as const;

const echoes = [
  { x: "-6%", channel: "r", blur: 4, opacity: 0.75 },
  { x: "6%", channel: "b", blur: 4, opacity: 0.75 },
  { x: "-13%", channel: "r", blur: 14, opacity: 0.35 },
  { x: "13%", channel: "b", blur: 14, opacity: 0.35 },
] as const;

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
          {(Object.keys(channelMatrices) as Array<keyof typeof channelMatrices>).map((channel) => (
            <filter
              key={channel}
              id={`${filterId}-${channel}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                result="noise"
              />
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values={channelMatrices[channel]}
                result="tint"
              />
              <feDisplacementMap in="tint" in2="noise" scale="14" />
            </filter>
          ))}
        </defs>
      </svg>
      {echoes.map((echo, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translateX(${echo.x})`,
            filter: `url(#${filterId}-${echo.channel}) blur(${echo.blur}px)`,
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
      <div className="relative w-full overflow-hidden pb-[100%]" style={{ clipPath }}>
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
