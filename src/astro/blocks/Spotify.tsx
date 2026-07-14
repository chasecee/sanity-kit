import { cleanMaybe, cleanResource } from "./utils";
import StableFrame from "./StableFrame";
import {
  parseSpotifyUrl,
  spotifyEmbedHeight,
  spotifyEmbedSrc,
  type SpotifySize,
  type SpotifyTheme,
} from "../utils/spotifyEmbed";

type SpotifyProps = {
  url?: string;
  title?: string;
  size?: SpotifySize;
  theme?: SpotifyTheme;
  draftMode: boolean;
  dataSanity?: string;
};

export default function Spotify({
  url,
  title,
  size = "default",
  theme = "dark",
  draftMode,
  dataSanity,
}: SpotifyProps) {
  const parsed = parseSpotifyUrl(cleanResource(url));
  if (!parsed) return null;

  const cleanSize = (cleanResource(size) || "default") as SpotifySize;
  const cleanTheme = (cleanResource(theme) || "dark") as SpotifyTheme;
  const height = spotifyEmbedHeight(parsed.kind, cleanSize);
  const src = spotifyEmbedSrc(parsed.embedUrl, cleanTheme);
  const embedTitle = cleanMaybe(title, draftMode) || `Spotify ${parsed.kind}`;

  return (
    <div
      className="measure"
      data-sanity={dataSanity}
    >
      <StableFrame
        src={src}
        title={embedTitle}
        width="100%"
        height={height}
        style={{ height }}
        className="embed-frame-fixed w-full border-0"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
