type OEmbedResponse = {
  title?: unknown;
  author_name?: unknown;
};

const TITLE_MAX = 200;
const FETCH_MS = 5000;

const SPOTIFY_PATH =
  /^\/(?:embed\/)?(album|track|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/i;
const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

function asText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalize(input: string): string | null {
  const trimmed = input.trim();
  const spotifyUri = trimmed.match(
    /^spotify:(album|track|playlist|artist|episode|show):([a-zA-Z0-9]+)$/i,
  );
  if (spotifyUri) {
    return `https://open.spotify.com/${spotifyUri[1].toLowerCase()}/${spotifyUri[2]}`;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "open.spotify.com" || host === "spotify.com") {
    const match = url.pathname.match(SPOTIFY_PATH);
    if (!match) return null;
    return `https://open.spotify.com/${match[1].toLowerCase()}/${match[2]}`;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const id =
      url.searchParams.get("v") ||
      url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1];
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return `https://www.youtube.com/watch?v=${id}`;
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return `https://www.youtube.com/watch?v=${id}`;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (!id || !VIMEO_ID.test(id)) return null;
    return `https://vimeo.com/${id}`;
  }

  return null;
}

function oEmbedEndpoint(canonical: string): string | null {
  const host = new URL(canonical).hostname.replace(/^www\./, "");
  if (host === "open.spotify.com") {
    return `https://open.spotify.com/oembed?url=${encodeURIComponent(canonical)}`;
  }
  if (host === "youtube.com") {
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonical)}`;
  }
  if (host === "vimeo.com") {
    return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(canonical)}`;
  }
  return null;
}

export function formatOEmbedTitle(data: OEmbedResponse): string | null {
  const title = asText(data.title).slice(0, TITLE_MAX);
  if (!title) return null;
  const author = asText(data.author_name).slice(0, 80);
  if (author && !title.includes(author)) {
    return `${title} · ${author}`.slice(0, TITLE_MAX);
  }
  return title;
}

export async function fetchOEmbedTitle(
  url: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const canonical = canonicalize(url);
  if (!canonical) return null;
  const endpoint = oEmbedEndpoint(canonical);
  if (!endpoint) return null;

  const timeout = AbortSignal.timeout(FETCH_MS);
  const combined =
    signal && "any" in AbortSignal
      ? AbortSignal.any([signal, timeout])
      : timeout;

  const res = await fetch(endpoint, {
    signal: combined,
    method: "GET",
    mode: "cors",
    credentials: "omit",
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const type = res.headers.get("content-type") || "";
  if (!type.includes("json")) return null;

  const data = (await res.json()) as OEmbedResponse;
  return formatOEmbedTitle(data);
}
