/**
 * Copyright (c) 2019 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import * as vscode from "vscode";
import * as path from "path";
import * as processUtil from "../util/process";

/**
 * Gets the first open workspace folder
 * @returns First open workspace folder if one exists. `undefined` if there is no open workspace.
 */
export function getWorkspaceFolder(): vscode.Uri | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri;
  }
  return undefined;
}

/**
 * @param targetDir target directory to generate open api client into
 * @returns java package name if it can compute one or the empty string
 */
export function getDefaultPackageName(targetDir: string): string {
  let index = targetDir.toLowerCase().indexOf(path.sep + "java" + path.sep);
  let defaultPackageName = "";
  if (index > -1) {
    // use everything after the "/java/" to be the package name
    index = index + 6;
    defaultPackageName = targetDir.substring(index).replace(new RegExp("\\" + path.sep, "g"), ".");
  }
  return defaultPackageName;
}

export async function generateRestClient(jarCommand: string): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating the MicroProfile REST Client interface template...",
    },
    () => processUtil.exec(jarCommand)
  );
}
