import * as vscode from "vscode";

export async function specifyYamlChoice(): Promise<string> {
    let yamlChoice: string = vscode.workspace.getConfiguration("microprofile.generator").get<string>("defaultYamlChoice");
    if (!yamlChoice) {
        yamlChoice = await vscode.window.showQuickPick(
            ["Generate from .yaml file", "Generate from url"],
            { ignoreFocusOut: true, placeHolder: "Select one of the following choices." },
        );
    }
    return yamlChoice && yamlChoice.toLowerCase();
}

export async function specifyTargetFile(): Promise<vscode.Uri> {
    const LABEL_CHOOSE_FOLDER: string = "Generate from this file";
    let fileUri: vscode.Uri = await openDialogForFile({ openLabel: LABEL_CHOOSE_FOLDER });
    return fileUri;
}

export async function specifyYamlPath(): Promise<string> {
    const defaultYamlPath: string = vscode.workspace.getConfiguration("microprofile.generator").get<string>("defaultYamlPath");
    return await getFromInputBox({
        placeHolder: "e.g. com.example",
        prompt: "Input yaml path for your project",
        //validateInput: yamlPathValidation,
        value: defaultYamlPath,
    });
}

export async function specifyTargetFolder(uri: vscode.Uri): Promise<vscode.Uri> {
    const LABEL_CHOOSE_FOLDER: string = "Generate into this package";
    let fileUri: vscode.Uri = await openDialogForFolder({
        openLabel: LABEL_CHOOSE_FOLDER,
        defaultUri: uri
    });
    return fileUri;
}

export async function getPackageName(srcDir: string, pathSep: string): Promise<string> {
    // looking for "/java/" from the path
    var index = srcDir.toLowerCase().indexOf(pathSep + "java" + pathSep);
    let defaultPackageName: string;
    if (index > -1) {  // use everything after the "/java/" to be the package name
        index = index + 6;
        defaultPackageName = srcDir.substring(index).replace(new RegExp("\\" + pathSep, "g"), ".");
    }
    
    var exp = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;   // validate the package name
    return await getFromInputBox({
        placeHolder: "e.g. com.example",
        prompt: "Input package name for your project",
        validateInput: (value: string) => {
            if (exp.test(value) === false) {
                return "Invalid package name";
            } else {
                return null;
            }
        },
        value: defaultPackageName,
    });
}

async function openDialogForFile(customOptions?: vscode.OpenDialogOptions): Promise<vscode.Uri> {
    const options: vscode.OpenDialogOptions = {
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
    };
    const result: vscode.Uri[] = await vscode.window.showOpenDialog(Object.assign(options, customOptions));
    if (result && result.length) {
        return Promise.resolve(result[0]);
    } else {
        return Promise.resolve(undefined);
    }
}

export async function getFromInputBox(options?: vscode.InputBoxOptions): Promise<string> {
    return await vscode.window.showInputBox(Object.assign({ ignoreFocusOut: true }, options));
}

export async function openDialogForFolder(customOptions: vscode.OpenDialogOptions): Promise<vscode.Uri> {
    const options: vscode.OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
    };
    const result: vscode.Uri[] = await vscode.window.showOpenDialog(Object.assign(options, customOptions));
    if (result && result.length) {
        return Promise.resolve(result[0]);
    } else {
        return Promise.resolve(undefined);
    }
}

export function deleteDirectory(path: string) {
    var fsExtra = require("fs-extra");

    return fsExtra.remove(path, function (err, results) {
        if (err) {
            console.error(err);
        }
        console.log('successfully deleted ' + path);
    });
}

export function deleteFile(path: string) {
    var fs = require("fs");

    fs.unlink(path, (err) => {
        if (err) {
            console.error(err);
        }
        console.log('Successfully deleted ' + path);
    });
}