import { useMemo } from "react";
import type { NavbarProps } from "sanity";
import { SiteLinkButton } from "./SiteLinkButton";

function SiteLink() {
  return <SiteLinkButton />;
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
