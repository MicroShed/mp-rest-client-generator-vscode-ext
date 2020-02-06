import * as vscode from "vscode";
import * as prompts from "../util/vscodePrompts";
import { INPUT_YAML_OPTIONS, GENERATOR_JAR_PATH } from "../constants";
import * as fileUtil from "../util/file";
import * as path from "path";
import * as childProcess from "child_process";
import { promisify } from "util";

const exec = promisify(childProcess.exec);

export async function generateProject(clickedFileUri: vscode.Uri | undefined): Promise<void> {
  try {
    let yamlInputFileURI: vscode.Uri | undefined;
    let yamlInputURL: string | undefined;

    const inputYamlMethod = await prompts.specifyYamlInputMethod();

    if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_FILE) {
      yamlInputFileURI = await prompts.specifyYamlFile();
    } else if (inputYamlMethod === INPUT_YAML_OPTIONS.FROM_URL) {
      yamlInputURL = await prompts.specifyYamlURL();
    }

    // if neither an input FileURI or input URL are specified exit the generator
    if (yamlInputFileURI === undefined && yamlInputURL === undefined) {
      return;
    }

    // ask for a folder to generate rest client into
    // use the folder clicked on by the user as the default if the command was
    // triggered by the file explorer
    const targetDirectory = await prompts.specifyTargetFolder(clickedFileUri);
    if (targetDirectory === undefined) {
      return;
    }

    const packageName = await prompts.specifyPackageName(targetDirectory.fsPath);
    if (packageName === undefined) {
      return;
    }

    // make a tmp directory in the target folder to generate files into
    const tmpDirPath = await fileUtil.generateTempDirectory(targetDirectory.fsPath);

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
      "\
          --api-package " +
      packageName +
      ".api \
          --model-package " +
      packageName +
      ".models";

    await exec(jarCommand);

    const packagePath = packageName.replace(/\./g, path.sep);
    const generatedRestClientPath = path.resolve(tmpDirPath, "src", "main", "java", packagePath);

    // copy the api/models folder into the target directory
    await fileUtil.copy(generatedRestClientPath, targetDirectory.fsPath);

    // remove the tmp directory after
    await fileUtil.deleteDirectory(tmpDirPath);
  } catch (e) {
    console.error(e);
    await vscode.window.showErrorMessage("Failed to generate rest client");
  }
}
