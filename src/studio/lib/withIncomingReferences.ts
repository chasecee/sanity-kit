import {
  defineIncomingReferenceDecoration,
  type IncomingReferencesOptions,
} from "sanity/structure";

type WithIncomingReferencesOptions = Pick<
  IncomingReferencesOptions,
  "types"
> & {
  title?: string;
  name?: string;
};

export function withIncomingReferences<T extends Record<string, unknown>>(
  schema: T,
  options: WithIncomingReferencesOptions,
): T {
  return {
    ...schema,
    renderMembers: (members: unknown[]) => [
      ...members,
      defineIncomingReferenceDecoration({
        name: options.name ?? "incomingReferences",
        title: options.title ?? "Referenced by",
        types: options.types,
      }),
    ],
  };
}
