import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { Box, Card, Stack } from "@sanity/ui";
import { useClient, type ObjectInputProps } from "sanity";
import { imageMasks, type ImageMaskShape } from "../../astro/blocks/masks";
import { STUDIO_API_VERSION } from "../lib/maxVideoFileSize";

type ImageMaskValue = {
  image?: SanityImageSource & { asset?: { _ref?: string } };
  mask?: string;
};

export function ImageMaskInput(props: ObjectInputProps<ImageMaskValue>) {
  const { value, renderDefault } = props;
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const builder = createImageUrlBuilder(client);
  const image = value?.image;
  const assetRef = image?.asset?._ref;
  const mask = (value?.mask as ImageMaskShape) || "triangle";
  const clipPath = imageMasks[mask] ?? imageMasks.triangle;

  const previewUrl =
    assetRef && image
      ? builder.image(image).width(480).height(480).fit("crop").auto("format").url()
      : null;

  if (!previewUrl) {
    return renderDefault(props);
  }

  return (
    <Stack space={3}>
      <Card padding={3} tone="transparent">
        <Box
          style={{
            maxWidth: 240,
            margin: "0 auto",
            aspectRatio: "1",
            clipPath,
            overflow: "hidden",
          }}
        >
          <img
            src={previewUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      </Card>
      {renderDefault(props)}
    </Stack>
  );
}
