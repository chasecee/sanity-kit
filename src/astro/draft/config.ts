import type { ClientConfig } from "@sanity/client";

type DraftConfig = {
  clientConfig: ClientConfig;
  studioUrl: string;
  readTokenEnvKey?: string;
};

let draftConfig: DraftConfig = {
  clientConfig: {
    projectId: "",
    dataset: "production",
    apiVersion: "2023-07-12",
    useCdn: false,
  },
  studioUrl: "http://localhost:3333",
  readTokenEnvKey: "SANITY_API_READ_TOKEN",
};

export function configureAstroDraft(options: DraftConfig) {
  draftConfig = options;
}

export function getAstroDraftConfig() {
  return draftConfig;
}
