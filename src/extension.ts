import * as vscode from "vscode";
import { generateProject } from "./commands/generateProject";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "microprofile.restclient.generate",
      (fileUri: vscode.Uri | undefined) => {
        generateProject(fileUri);
      }
    )
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}
