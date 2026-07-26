import { createHeicAwareClient } from "./heic";

export const kitStudioConfig = {
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  tasks: { enabled: false },
  announcements: { enabled: false },
  apps: { canvas: { enabled: false } },
  document: {
    comments: { enabled: false },
  },
  unstable_clientFactory: createHeicAwareClient,
} as const;
