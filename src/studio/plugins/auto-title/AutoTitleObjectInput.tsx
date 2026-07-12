import { useEffect, useRef } from "react";
import { set, type ObjectInputProps } from "sanity";
import { fetchOEmbedTitle } from "./fetchOEmbedTitle";

type WithUrlTitle = {
  url?: string;
  title?: string;
};

export function AutoTitleObjectInput(props: ObjectInputProps) {
  const value = (props.value as WithUrlTitle | undefined) ?? {};
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const onChange = props.onChange;
  const inFlight = useRef("");

  useEffect(() => {
    if (!url || title) return;
    if (inFlight.current === url) return;

    inFlight.current = url;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const next = await fetchOEmbedTitle(url, controller.signal);
        if (!next || controller.signal.aborted) return;
        onChange(set(next, ["title"]));
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        if (inFlight.current === url) inFlight.current = "";
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      if (inFlight.current === url) inFlight.current = "";
    };
  }, [url, title, onChange]);

  return props.renderDefault(props);
}
