type KitTypegenOptions = {
  path?: string | string[];
  schema?: string;
  generates?: string;
  enforceRequiredFields?: boolean;
};

const DEFAULT_SCHEMA = "../site/schema.json";
const DEFAULT_PATH = "../site/sanity/**/*.{ts,tsx}";
const DEFAULT_GENERATES = "../site/sanity/sanity.types.ts";

export function kitTypegenConfig(options: KitTypegenOptions = {}) {
  const schema = options.schema ?? DEFAULT_SCHEMA;
  return {
    schemaExtraction: {
      enabled: true as const,
      path: schema,
      ...(options.enforceRequiredFields !== undefined
        ? { enforceRequiredFields: options.enforceRequiredFields }
        : {}),
    },
    typegen: {
      enabled: true as const,
      path: options.path ?? DEFAULT_PATH,
      schema,
      generates: options.generates ?? DEFAULT_GENERATES,
    },
  };
}
