import * as path from "path";

export const INPUT_YAML_OPTIONS = {
  FROM_FILE: "Generate from a .yaml file",
  FROM_URL: "Generate from a url",
};

export const GENERATOR_JAR_PATH = path.join(
  __dirname,
  "../node_modules/@openapitools/openapi-generator-cli/bin/openapi-generator.jar"
);
