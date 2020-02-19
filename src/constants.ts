import * as path from "path";

export const INPUT_OPTIONS = {
  FROM_FILE: "Generate from an OpenAPI file",
  FROM_URL: "Generate from a url",
};

export const GENERATOR_JAR_PATH = path.join(
  __dirname,
  "../node_modules/@openapitools/openapi-generator-cli/bin/openapi-generator.jar"
);

export const SPEC_VALIDATION_EXCEPTION = "SpecValidationException";
