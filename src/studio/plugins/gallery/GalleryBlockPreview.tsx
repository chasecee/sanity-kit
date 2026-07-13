import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { DragHandleIcon } from "@sanity/icons/DragHandle";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import { useClient } from "sanity";

type Thumb = {
  _key?: string;
  asset?: SanityImageSource;
};

type GalleryBlockPreviewProps = {
  title?: string;
  subtitle?: string;
  thumbs?: Thumb[];
};

export function GalleryBlockPreview({
  title,
  subtitle,
  thumbs,
}: GalleryBlockPreviewProps) {
  const client = useClient({ apiVersion: "2023-10-01" });
  const builder = createImageUrlBuilder(client);
  const items = Array.isArray(thumbs) ? thumbs.slice(0, 6) : [];

  return (
    <Card padding={2} style={{ cursor: "grab" }}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Box style={{ lineHeight: 0, opacity: 0.7 }}>
            <DragHandleIcon />
          </Box>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              {title || "Gallery"}
            </Text>
            {subtitle ? (
              <Text size={1} muted>
                {subtitle}
              </Text>
            ) : null}
          </Stack>
        </Flex>
        {items.length > 0 ? (
          <Flex gap={2}>
            {items.map((item, idx) => {
              const src = item.asset
                ? builder.image(item.asset).width(96).height(72).fit("crop").auto("format").url()
                : "";
              return (
                <Box
                  key={item._key || `thumb-${idx}`}
                  style={{
                    width: 48,
                    height: 36,
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "var(--card-muted-bg-color)",
                  }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      draggable={false}
                      width={48}
                      height={36}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        WebkitUserDrag: "none",
                      }}
                    />
                  ) : null}
                </Box>
              );
            })}
          </Flex>
        ) : null}
      </Stack>
    </Card>
  );
}
