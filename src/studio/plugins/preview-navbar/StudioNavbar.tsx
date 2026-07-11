import { useMemo, useSyncExternalStore } from "react";
import { Button, Menu, MenuButton, Text } from "@sanity/ui";
import type { NavbarProps } from "sanity";
import {
  getActiveDocument,
  subscribeActiveDocument,
} from "../../lib/activeDocument";
import {
  getSiteBaseUrl,
  resolveDocumentUrl,
} from "../../lib/resolveProductionUrl";

function SiteLink() {
  const active = useSyncExternalStore(
    subscribeActiveDocument,
    getActiveDocument,
    () => null,
  );
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
  const label = href.replace(/^https?:\/\//, "");

  return (
    <MenuButton
      id="site-link-preview"
      button={
        <Button
          mode="bleed"
          tone="primary"
          fontSize={1}
          padding={2}
          text="Preview"
        />
      }
      menu={
        <Menu>
          <Text size={1}>
            <a href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          </Text>
        </Menu>
      }
      popover={{
        padding: 3,
        placement: "bottom",
        fallbackPlacements: ["bottom-start", "bottom-end"],
        preventOverflow: false,
        portal: true,
      }}
    />
  );
}

const siteLinkAction = {
  location: "topbar" as const,
  name: "site-link",
  render: SiteLink,
};

export function StudioNavbar(props: NavbarProps) {
  const actionNames = (props.__internal_actions ?? [])
    .map((action) => action.name)
    .join("|");
  const actions = useMemo(() => {
    const prev = props.__internal_actions ?? [];
    if (prev.some((action) => action.name === siteLinkAction.name)) return prev;
    return [...prev, siteLinkAction];
  }, [actionNames]);

  return props.renderDefault({
    ...props,
    __internal_actions: actions,
  });
}
