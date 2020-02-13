import * as vscode from "vscode";
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
    placeHolder: "Select one of the following choices.",
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
    placeHolder: "e.g. com.example",
    prompt: "Input yaml path for your project",
    ignoreFocusOut: true,
  });
}

export async function askForTargetFolder(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFolder({
    openLabel: "Generate into this package",
    defaultUri: defaultUri,
  });
}
