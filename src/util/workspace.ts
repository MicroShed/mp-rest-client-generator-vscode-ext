import * as vscode from "vscode";
import * as path from "path";

export function getWorkspaceFolderIfExists(): vscode.Uri | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri;
  }
  return undefined;
}

// package name is all directories after the /java/ dir, otherwise empty
export function getPackageName(srcDir: string): string {
  let index = srcDir.toLowerCase().indexOf(path.sep + "java" + path.sep);
  let defaultPackageName = "";
  if (index > -1) {
    // use everything after the "/java/" to be the package name
    index = index + 6;
    return defaultPackageName = srcDir.substring(index).replace(new RegExp("\\" + path.sep, "g"), ".");
  }
  return defaultPackageName;
}