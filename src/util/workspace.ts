import * as vscode from "vscode";

export function getWorkspaceFolderIfExists(): vscode.Uri | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri;
  }
  return undefined;
}
