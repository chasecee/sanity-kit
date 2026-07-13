import { SpacedField } from "../inputs/SpacedField";

export const videoPosterField = {
  name: "poster",
  title: "Poster",
  type: "image",
  description: "First-frame preview. Replace to change the thumbnail.",
  options: { hotspot: true },
  components: { field: SpacedField },
};

export const videoDimensionFields = [
  {
    name: "width",
    title: "Width",
    type: "number",
    hidden: true,
  },
  {
    name: "height",
    title: "Height",
    type: "number",
    hidden: true,
  },
];

export const videoDerivedFields = [videoPosterField, ...videoDimensionFields];
