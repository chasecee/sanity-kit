import { media as mediaPlugin, mediaAssetSource } from "sanity-plugin-media";

export { mediaPlugin, mediaAssetSource };

export const mediaSources = [
  {
    ...mediaAssetSource,
    name: "mediaLibrary",
    title: "Media Library",
  },
];
