import { useLayoutEffect, useRef, type IframeHTMLAttributes } from "react";
import { stegaClean } from "@sanity/client/stega";

type StableFrameProps = Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src"> & {
  src: string;
};

export default function StableFrame({ src, title, ...rest }: StableFrameProps) {
  const cleanSrc = stegaClean(src).trim();
  const cleanTitle = title ? stegaClean(String(title)) : undefined;
  const ref = useRef<HTMLIFrameElement>(null);
  const renderSrc = useRef(cleanSrc);
  const committed = useRef(cleanSrc);

  useLayoutEffect(() => {
    if (committed.current === cleanSrc) return;
    committed.current = cleanSrc;
    const node = ref.current;
    if (node) node.src = cleanSrc;
  }, [cleanSrc]);

  return <iframe ref={ref} src={renderSrc.current} title={cleanTitle} {...rest} />;
}
