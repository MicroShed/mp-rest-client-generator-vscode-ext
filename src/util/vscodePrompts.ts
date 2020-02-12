import * as vscode from "vscode";
import * as path from "path";
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
    prompt: "Input yaml path for your project",
    ignoreFocusOut: true,
  });
}

export async function askForTargetFolder(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFolder({
    openLabel: "Generate REST client into this package",
    defaultUri: defaultUri,
  });
}

export async function askForPackageName(srcDir: string): Promise<string | undefined> {
  // looking for "/java/" from the path
  let index = srcDir.toLowerCase().indexOf(path.sep + "java" + path.sep);
  let defaultPackageName: string | undefined;
  if (index > -1) {
    // use everything after the "/java/" to be the package name
    index = index + 6;
    defaultPackageName = srcDir.substring(index).replace(new RegExp("\\" + path.sep, "g"), ".");
  }

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
