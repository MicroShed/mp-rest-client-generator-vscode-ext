import * as vscode from "vscode";
import * as path from "path";
import {
  INPUT_YAML_OPTIONS,
  EXTENSION_CONFIGURATION_IDENTIFIER,
  DEFAULT_YAML_CHOICE_IDENTIFIER,
  DEFAULT_YAML_PATH_IDENTIFIER,
} from "../constants";

async function askForFile(
  customOptions?: vscode.OpenDialogOptions
): Promise<vscode.Uri | undefined> {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    ...customOptions,
  };
  const result: vscode.Uri[] | undefined = await vscode.window.showOpenDialog(options);

  if (result && result.length > 0) {
    return result[0];
  }

  return undefined;
}

export async function askForFolder(
  customOptions: vscode.OpenDialogOptions
): Promise<vscode.Uri | undefined> {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    ...customOptions,
  };
  const result: vscode.Uri[] | undefined = await vscode.window.showOpenDialog(options);
  if (result && result.length > 0) {
    return result[0];
  }

  return undefined;
}

export async function specifyYamlInputMethod(): Promise<string | undefined> {
  const defaultYamlChoice = vscode.workspace
    .getConfiguration(EXTENSION_CONFIGURATION_IDENTIFIER)
    .get<string>(DEFAULT_YAML_CHOICE_IDENTIFIER);

  if (defaultYamlChoice) {
    return defaultYamlChoice;
  }

  return vscode.window.showQuickPick([INPUT_YAML_OPTIONS.FROM_FILE, INPUT_YAML_OPTIONS.FROM_URL], {
    ignoreFocusOut: true,
    placeHolder: "Select one of the following choices.",
  });
}

export async function specifyYamlFile(): Promise<vscode.Uri | undefined> {
  return askForFile({
    openLabel: "Generate from this file",
  });
}

export async function specifyYamlURL(): Promise<string | undefined> {
  const defaultYamlPath = vscode.workspace
    .getConfiguration(EXTENSION_CONFIGURATION_IDENTIFIER)
    .get<string>(DEFAULT_YAML_PATH_IDENTIFIER);

  return vscode.window.showInputBox({
    placeHolder: "e.g. com.example",
    prompt: "Input yaml path for your project",
    ignoreFocusOut: true,
    value: defaultYamlPath,
  });
}

export async function specifyTargetFolder(
  defaultUri?: vscode.Uri
): Promise<vscode.Uri | undefined> {
  return askForFolder({
    openLabel: "Generate into this package",
    defaultUri: defaultUri,
  });
}

export async function specifyPackageName(srcDir: string): Promise<string | undefined> {
  // looking for "/java/" from the path
  let index = srcDir.toLowerCase().indexOf(path.sep + "java" + path.sep);
  let defaultPackageName: string | undefined;
  if (index > -1) {
    // use everything after the "/java/" to be the package name
    index = index + 6;
    defaultPackageName = srcDir.substring(index).replace(new RegExp("\\" + path.sep, "g"), ".");
  }

  const packageNameRegex = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/; // validate the package name
  return await vscode.window.showInputBox({
    placeHolder: "e.g. com.example",
    prompt: "Input package name for your project",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (packageNameRegex.test(value) === false) {
        return "Invalid package name";
      } else {
        return null;
      }
    },
    value: defaultPackageName,
  });
}
