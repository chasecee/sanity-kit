import { createClient, type QueryParams } from "@sanity/client";
import {
  useLiveMode,
  useQuery,
  type QueryResponseInitial,
} from "./loader";
import { getAstroDraftConfig } from "./config";

export type { QueryResponseInitial };

export function useLiveQuery<T>(
  query: string,
  params: QueryParams,
  options: { initial: QueryResponseInitial<T> },
) {
  const { clientConfig, studioUrl } = getAstroDraftConfig();
  const liveClient = createClient({
    ...clientConfig,
    useCdn: true,
    stega: {
      enabled: true,
      studioUrl,
    },
  });
  useLiveMode({ client: liveClient, studioUrl });
  return useQuery<T>(query, params, options);
}
