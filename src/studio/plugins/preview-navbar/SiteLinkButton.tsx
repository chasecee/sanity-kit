import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LaunchIcon } from "@sanity/icons/Launch";
import { Box, Button, Popover, Text } from "@sanity/ui";
import {
  getActiveDocument,
  subscribeActiveDocument,
} from "../../lib/activeDocument";
import {
  getSiteBaseUrl,
  resolveDocumentUrl,
} from "../../lib/resolveProductionUrl";

export function SiteLinkButton() {
  const active = useSyncExternalStore(
    subscribeActiveDocument,
    getActiveDocument,
    () => null,
  );
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseUrl = getSiteBaseUrl();
  const href = active
    ? resolveDocumentUrl(baseUrl, undefined, {
        document: {
          _type: active.type,
          slug: active.slug ? { current: active.slug } : undefined,
        },
        schemaType: active.type,
      })
    : baseUrl;
  const typeLabel = active?.type
    ? `${active.type[0].toUpperCase()}${active.type.slice(1)}`
    : undefined;
  const label = `View ${typeLabel || "site"}`;

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const openPopover = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closePopover = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  return (
    <Popover
      content={
        <Box onMouseEnter={openPopover} onMouseLeave={closePopover} padding={3}>
          <Text size={1}>
            <a href={href} target="_blank" rel="noreferrer">
              {href}
            </a>
          </Text>
        </Box>
      }
      open={open}
      placement="bottom"
      fallbackPlacements={["bottom-start", "bottom-end"]}
      portal
      preventOverflow={false}
    >
      <div onMouseEnter={openPopover} onMouseLeave={closePopover}>
        <Button
          as="a"
          href={href}
          target="_blank"
          rel="noreferrer"
          mode="bleed"
          selected
          text={label}
          iconRight={LaunchIcon}
          aria-label={label}
          onFocus={openPopover}
          onBlur={closePopover}
          padding={2}
        />
      </div>
    </Popover>
  );
}
