/**
 * Copyright (c) 2019, 2024 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import * as vscode from "vscode";
import { getDefaultPackageName } from "./workspace";
import { INPUT_OPTIONS, MP_REST_CLIENT_VERSION } from "../constants";

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

export async function askForInputMethod(): Promise<string | undefined> {
  return vscode.window.showQuickPick([INPUT_OPTIONS.FROM_FILE, INPUT_OPTIONS.FROM_URL], {
    ignoreFocusOut: true,
    placeHolder: "Select a method of providing an OpenAPI file.",
  });
}

export async function askForInputFile(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFile({
    openLabel: "Generate from this file",
    defaultUri: defaultUri,
  });
}

export async function askForInputURL(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    placeHolder: "e.g. http://www.example.com/openapi.yaml",
    prompt: "Generate from the file at this URL",
    ignoreFocusOut: true,
  });
}

export async function askForTargetFolder(defaultUri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  return askForFolder({
    openLabel: "Generate REST Client into this package",
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

export async function askForMPRestClientVersion(): Promise<string | undefined> {
  return vscode.window.showQuickPick([MP_REST_CLIENT_VERSION.VERSION_30, MP_REST_CLIENT_VERSION.VERSION_20, MP_REST_CLIENT_VERSION.VERSION_141], {
    ignoreFocusOut: true,
    placeHolder: "Select the MicroProfle Rest Client version.",
  });
}