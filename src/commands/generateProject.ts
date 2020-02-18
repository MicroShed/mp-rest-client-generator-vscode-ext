import * as vscode from "vscode";
import * as path from "path";
import * as prompts from "../util/vscodePrompts";
import { INPUT_YAML_OPTIONS, GENERATOR_JAR_PATH, SPEC_VALIDATION_EXCEPTION } from "../constants";
import * as fileUtil from "../util/file";
import { getWorkspaceFolder, generateRestClient } from "../util/workspace";

export async function generateProject(clickedFileUri: vscode.Uri | undefined): Promise<void> {
  // extension uses a tmp directory to download / generate files into
  let tmpDirPath: string | undefined;
  let yamlType: string | undefined;

  // default URI to use when presenting the user a file picker
  // ie. when asking for yaml file or target folder to generate rest client into
  const defaultFilePickerURI = clickedFileUri != null ? clickedFileUri : getWorkspaceFolder();

  try {
    const inputYamlMethod = await prompts.askForYamlInputMethod();

    let yamlInputFileURI: vscode.Uri | undefined;
    let yamlInputURL: string | undefined;

    if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_FILE) {
      yamlInputFileURI = await prompts.askForYamlFile(defaultFilePickerURI);
      yamlType = "file";
    } else if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_URL) {
      yamlInputURL = await prompts.askForYamlURL();
      yamlType = "url";
    }

    // if neither an input file or input URL are specified exit the generator
    if (yamlInputFileURI === undefined && yamlInputURL === undefined) {
      return;
    }

    // ask for a folder to generate rest client into
    // use the fileURI clicked on by the user as the default if
    // the command was triggered from the file explorer
    const targetDirectory = await prompts.askForTargetFolder(defaultFilePickerURI);
    if (targetDirectory === undefined) {
      return;
    }

    const packageName = await prompts.askForPackageName(targetDirectory.fsPath);
    if (packageName === undefined) {
      return;
    }

    // make a tmp directory in the target folder to generate files into
    tmpDirPath = await fileUtil.generateTempDirectory();

    // if they are using a URL download the file to the temp directory
    if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_URL) {
      const requestOptions = {
        // yamlInputURL must exist if input method is FROM_URL
        url: yamlInputURL!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        method: "GET",
      };
      const downloadLocation = path.join(tmpDirPath, "openapi.yaml");

      try {
        await fileUtil.downloadFile(requestOptions, downloadLocation);
        yamlInputFileURI = vscode.Uri.parse(downloadLocation);
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(
          `Failed to download yaml file from "${yamlInputURL}" to directory "${downloadLocation}"`
        );
        return;
      }
    }

    if (yamlInputFileURI === undefined) {
      return;
    }

    // add .api /.models to package name or just use package api package models
    // if no package name was provided
    const apiPackageName = packageName !== "" ? `${packageName}.api` : "api";
    const modelPackageName = packageName !== "" ? `${packageName}.models` : "models";

    // execute generator in temp dir
    let jarCommand =
      "java -jar " +
      GENERATOR_JAR_PATH +
      " generate " +
      "-p useMultipart=false  " +
      "-i " +
      yamlInputFileURI.fsPath +
      " -g java --library microprofile -o " +
      tmpDirPath +
      " --api-package " +
      apiPackageName +
      " --model-package " +
      modelPackageName;
    try {
      await generateRestClient(jarCommand);
    } catch (e) {
      console.error(e);
      if (!e.message.includes(jarCommand)) {
        return; // show generic error message
      } else {
        // get error description returned from executing jar command
        let err = e.message.trim().split(jarCommand);
        err = err[1].trim().split("\n")[0];

        // catch spec validation error
        if (err.includes(SPEC_VALIDATION_EXCEPTION)) {
          const selection = await vscode.window.showErrorMessage(
            `The provided yaml ${yamlType} failed the OpenAPI specification validation. Would you like to generate without specification validation?`,
            ...["Yes", "No"]
          );
          if (selection === "Yes") {
            jarCommand += " --skip-validate-spec";
            await generateRestClient(jarCommand);
          } else {
            return;
          }
        } else {
          vscode.window.showErrorMessage(
            `Failed to generate a MicroProfile Rest Client interface from the provided yaml ${yamlType}: ${err}`
          );
          return;
        }
      }
    }

    const packagePath = packageName.replace(/\./g, path.sep);
    const generatedRestClientPath = path.resolve(tmpDirPath, "src", "main", "java", packagePath);

    // copy the api/models folder from the generated directory into the target directory
    await fileUtil.copy(generatedRestClientPath, targetDirectory.fsPath);
    vscode.window.showInformationMessage(
      "Successfully generated a MicroProfile Rest Client interface template."
    );
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage(
      "Failed to generate MicroProfile Rest Client interface template."
    );
  } finally {
    // remove the tmp directory after if it exists
    if (tmpDirPath !== undefined && (await fileUtil.exists(tmpDirPath))) {
      try {
        await fileUtil.deleteDirectory(tmpDirPath);
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(`Failed to delete the directory ${tmpDirPath}`);
      }
    }
  }
}
