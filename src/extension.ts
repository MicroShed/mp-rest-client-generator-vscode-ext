import * as vscode from "vscode";
import { generateProject } from "./util/GenerateProject";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("microprofile.restclient.generate", fileUri => {
      generateProject(fileUri);
    })
  );
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}
