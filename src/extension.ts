import * as vscode from 'vscode';
import { generateProject } from './util/GenerateProject';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('extension "vscode-microprofile-generator" is now active!');
	context.subscriptions.push(vscode.commands.registerCommand("microprofile.restclient.generate", (fileUri) => {
		generateProject(fileUri);
	}));

}

// this method is called when your extension is deactivated
export function deactivate() {}
