import { Flex } from "@sanity/ui";
import type { ToolMenuProps } from "sanity";
import { SiteLinkButton } from "./SiteLinkButton";

export function StudioToolMenu(props: ToolMenuProps) {
  if (props.context !== "topbar") {
    return props.renderDefault(props);
  }

  return (
    <Flex align="center" gap={1}>
      {props.renderDefault(props)}
      <SiteLinkButton />
    </Flex>
  );
}
