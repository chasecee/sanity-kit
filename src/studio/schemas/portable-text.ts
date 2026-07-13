import { ColumnsPortableTextPlugin } from "../plugins/columns";
import { columnsBlock, contentBlocks } from "./blocks";

type PortableTextReference = { type: string };
type PortableTextObject = Record<string, unknown>;
type ContentBlockType = "embed" | "spotify" | "gallery" | "skills" | "image" | "media" | "columns";

type CreateContentPortableTextOptions = {
  referenceTypes?: string[] | PortableTextReference[];
  extraOf?: PortableTextObject[];
  includeBlocks?: ContentBlockType[];
};

function toReferenceTypes(
  value: CreateContentPortableTextOptions["referenceTypes"],
): PortableTextReference[] {
  if (!value || value.length === 0) return [{ type: "project" }, { type: "page" }];
  if (typeof value[0] === "string") {
    return (value as string[]).map((type) => ({ type }));
  }
  return value as PortableTextReference[];
}

export function createContentPortableText(options?: CreateContentPortableTextOptions) {
  const referenceTypes = toReferenceTypes(options?.referenceTypes);
  const extraOf = options?.extraOf ?? [];
  return {
    components: {
      portableText: {
        plugins: ColumnsPortableTextPlugin,
      },
    },
    of: [
      {
        type: "block",
        marks: {
          annotations: [
            {
              name: "link",
              type: "object",
              title: "External link",
              fields: [
                {
                  name: "href",
                  type: "url",
                  title: "URL",
                },
                {
                  title: "Open in new tab",
                  name: "blank",
                  type: "boolean",
                },
              ],
            },
            {
              name: "internalLink",
              type: "object",
              title: "Internal link",
              fields: [
                {
                  name: "reference",
                  type: "reference",
                  title: "Reference",
                  to: referenceTypes,
                },
              ],
            },
          ],
        },
      },
      ...extraOf,
      columnsBlock,
      ...contentBlocks({ include: options?.includeBlocks }),
    ],
  };
}
