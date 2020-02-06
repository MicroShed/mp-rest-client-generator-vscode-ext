import * as vscode from "vscode";
import * as path from "path";
import * as prompts from "../util/vscodePrompts";
import { INPUT_YAML_OPTIONS, GENERATOR_JAR_PATH } from "../constants";
import * as fileUtil from "../util/file";
import * as processUtil from "../util/process";

export async function generateProject(clickedFileUri: vscode.Uri | undefined): Promise<void> {
  // extension uses a tmp directory to download / generate files
  let tmpDirPath: string | undefined;

  try {
    const inputYamlMethod = await prompts.askForYamlInputMethod();

    let yamlInputFileURI: vscode.Uri | undefined;
    let yamlInputURL: string | undefined;

    if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_FILE) {
      yamlInputFileURI = await prompts.askForYamlFile();
    } else if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_URL) {
      yamlInputURL = await prompts.askForYamlURL();
    }

    // if neither an input file URI or input URL are specified exit the generator
    if (yamlInputFileURI === undefined && yamlInputURL === undefined) {
      return;
    }

    // ask for a folder to generate rest client into
    // use the fileURI clicked on by the user as the default if
    // the command was triggered from the file explorer and not the command palette
    const targetDirectory = await prompts.askForTargetFolder(clickedFileUri);
    if (targetDirectory === undefined) {
      return;
    }

    const packageName = await prompts.askForPackageName(targetDirectory.fsPath);
    if (packageName === undefined) {
      return;
    }

    // make a tmp directory in the target folder to generate files into
    tmpDirPath = await fileUtil.generateTempDirectory(targetDirectory.fsPath);

    // if they are using a URL download the file to the temp directory
    if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_URL) {
      const requestOptions = {
        // yamlInput must exist if input time is URL
        url: yamlInputURL!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        method: "GET",
      };
      const downloadLocation = path.join(tmpDirPath, "openapi.yaml");
      await fileUtil.downloadFile(requestOptions, downloadLocation);
      yamlInputFileURI = vscode.Uri.parse(downloadLocation);
    }

    // the input file URI should now exist. Either by specifying the URI directly
    // or giving a URL and then downloading the file into the tmp directory
    if (yamlInputFileURI === undefined) {
      return;
    }

    // execute generator in temp dir
    const jarCommand =
      "java -jar " +
      GENERATOR_JAR_PATH +
      " generate " +
      "-p useMultipart=false  " +
      "-i " +
      yamlInputFileURI.fsPath +
      " -g java --library microprofile -o " +
      tmpDirPath +
      " --api-package " +
      packageName +
      ".api --model-package " +
      packageName +
      ".models";

    await processUtil.exec(jarCommand);

    const packagePath = packageName.replace(/\./g, path.sep);
    const generatedRestClientPath = path.resolve(tmpDirPath, "src", "main", "java", packagePath);

    // copy the api/models folder from the generated directory into the target directory
    await fileUtil.copy(generatedRestClientPath, targetDirectory.fsPath);
  } catch (e) {
    console.error(e);
    await vscode.window.showErrorMessage("Failed to generate MicroProfile rest client");
  } finally {
    // remove the tmp directory after if it exists
    if (tmpDirPath !== undefined && (await fileUtil.exists(tmpDirPath))) {
      await fileUtil.deleteDirectory(tmpDirPath);
    }
  }
}
