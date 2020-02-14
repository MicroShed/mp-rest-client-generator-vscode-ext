import * as vscode from "vscode";
import { getDefaultPackageName } from "./workspace";
import { INPUT_YAML_OPTIONS } from "../constants";

async function askForFile(
  customOptions?: vscode.OpenDialogOptions
): Promise<vscode.Uri | undefined> {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    ...customOptions,
  };

  const result = await vscode.window.showOpenDialog(options);
  if (result && result.length > 0) {
    return result[0];
  }

  return undefined;
}

async function askForFolder(
  customOptions: vscode.OpenDialogOptions
): Promise<vscode.Uri | undefined> {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    ...customOptions,
  };

  const result = await vscode.window.showOpenDialog(options);
  if (result && result.length > 0) {
    return result[0];
  }

  return undefined;
}

export async function askForYamlInputMethod(): Promise<string | undefined> {
  return vscode.window.showQuickPick([INPUT_YAML_OPTIONS.FROM_FILE, INPUT_YAML_OPTIONS.FROM_URL], {
    ignoreFocusOut: true,
    placeHolder: "Select a method of providing a yaml file.",
  });
}

export async function askForYamlFile(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFile({
    openLabel: "Generate from this file",
    defaultUri: defaultUri,
  });
}

export async function askForYamlURL(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    placeHolder: "e.g. http://www.example.com/openapi.yaml",
    prompt: "Generate from yaml file at this URL",
    ignoreFocusOut: true,
  });
}

export async function askForTargetFolder(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFolder({
    openLabel: "Generate REST client into this package",
    defaultUri: defaultUri,
  });
}

export async function askForPackageName(targetDir: string): Promise<string | undefined> {
  const defaultPackageName = getDefaultPackageName(targetDir);
  const packageNameRegex = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/; // used to validate the package name
  return await vscode.window.showInputBox({
    placeHolder: "e.g. com.example",
    prompt: "Input package name for your project",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      // allow no package name or a valid java package name
      if (value !== "" && packageNameRegex.test(value) === false) {
        return "Invalid package name";
      } else {
        return null;
      }
    },
    value: defaultPackageName,
  });
}
