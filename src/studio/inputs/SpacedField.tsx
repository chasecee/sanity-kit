import { Box } from "@sanity/ui";
import type { FieldProps } from "sanity";

export function SpacedField(props: FieldProps) {
  return (
    <Box paddingTop={4} paddingBottom={2}>
      {props.renderDefault(props)}
    </Box>
  );
}
