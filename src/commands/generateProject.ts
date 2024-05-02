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
import * as path from "path";
import * as prompts from "../util/vscodePrompts";
import { INPUT_OPTIONS, GENERATOR_JAR_PATH, SPEC_VALIDATION_EXCEPTION, LIB_PATH } from "../constants";
import * as fileUtil from "../util/file";
import { getWorkspaceFolder, generateRestClient } from "../util/workspace";

export async function generateProject(clickedFileUri: vscode.Uri | undefined): Promise<void> {
  // extension uses a tmp directory to download / generate files into
  let tmpDirPath: string | undefined;
  let inputType: string | undefined;

  // default URI to use when presenting the user a file picker
  // ie. when asking for file or target folder to generate REST client into
  const defaultFilePickerURI = clickedFileUri !== null ? clickedFileUri : getWorkspaceFolder();

  try {

    try {
      await fileUtil.downloadGeneratorCli();
    } catch (e) {
      let errMsg = e instanceof Error ? e.message : new String(e);
      vscode.window.showErrorMessage(`${errMsg}`);
      return;
    }

    const inputMethod = await prompts.askForInputMethod();

    let inputFileURI: vscode.Uri | undefined;
    let inputURL: string | undefined;

    if (inputMethod === INPUT_OPTIONS.FROM_FILE) {
      inputFileURI = await prompts.askForInputFile(defaultFilePickerURI);
      inputType = "file";
    } else if (inputMethod === INPUT_OPTIONS.FROM_URL) {
      inputURL = await prompts.askForInputURL();
      inputType = "url";
    }

    // if neither an input file or input URL are specified exit the generator
    if (inputFileURI === undefined && inputURL === undefined) {
      return;
    }

    // ask for a folder to generate REST client into
    // use the fileURI clicked on by the user as the default if
    // the command was triggered from the file explorer
    const targetDirectory = await prompts.askForTargetFolder(defaultFilePickerURI);
    if (targetDirectory === undefined) {
      return;
    }

    const packageName = await prompts.askForPackageName(targetDirectory.fsPath);
    if (packageName === undefined) {
      return;
    }

    // make a tmp directory in the target folder to generate files into
    tmpDirPath = await fileUtil.generateTempDirectory();

    // if they are using a URL download the file to the temp directory
    if (inputMethod === INPUT_OPTIONS.FROM_URL) {
      const requestOptions = {
        // inputURL must exist if input method is FROM_URL
        url: inputURL!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        method: "GET",
      };
      const downloadLocation = path.join(tmpDirPath, "openapi.yaml");

      try {
        await fileUtil.downloadFile(requestOptions, downloadLocation);
        inputFileURI = vscode.Uri.parse(downloadLocation);
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(
          `Failed to download file from "${inputURL}" to directory "${downloadLocation}"`
        );
        return;
      }
    }

    if (inputFileURI === undefined) {
      return;
    }

    const mpRestClientVersion = await prompts.askForMPRestClientVersion();
    if (mpRestClientVersion === undefined) {
      return;
    }

    // add .api /.models to package name or just use package api package models
    // if no package name was provided
    const apiPackageName = packageName !== "" ? `${packageName}.api` : "api";
    const modelPackageName = packageName !== "" ? `${packageName}.models` : "models";

    // execute generator in temp dir
    let jarCommand =
      "java -jar " +
      GENERATOR_JAR_PATH +
      " generate " +
      "-p useMultipart=false " +
      "-p microprofileRestClientVersion=" + mpRestClientVersion + " " +
      "-p disableMultipart=true " +
      "-i " +
      inputFileURI.fsPath +
      " -g java --library microprofile -o " +
      tmpDirPath +
      " --api-package " +
      apiPackageName +
      " --model-package " +
      modelPackageName;
    try {
      await generateRestClient(jarCommand);
    } catch (e) {
      console.error(e);
      let errMsg = e instanceof Error ? e.message : new String(e);
      if (errMsg.includes(jarCommand)) {
        // get error description returned from executing jar command
        let errArray = errMsg.trim().split(jarCommand);
        let err = errArray[1].trim().split("\n")[0];

        // catch spec validation error
        if (err.includes(SPEC_VALIDATION_EXCEPTION)) {
          const selection = await vscode.window.showErrorMessage(
            `The provided ${inputType} failed the OpenAPI specification validation. Would you like to generate without specification validation?`,
            ...["Yes", "No"]
          );
          if (selection === "Yes") {
            jarCommand += " --skip-validate-spec";
            await generateRestClient(jarCommand);
          } else {
            return;
          }
        } else {
          vscode.window.showErrorMessage(
            `Failed to generate a MicroProfile REST Client interface from the provided ${inputType}: ${err}`
          );
          return;
        }
      } else {
        throw new Error("Failed to generate a MicroProfile REST Client interface template");
      }
    }

    const packagePath = packageName.replace(/\./g, path.sep);
    const generatedRestClientPath = path.resolve(tmpDirPath, "src", "main", "java", packagePath);

    // copy the api/models folder from the generated directory into the target directory
    await fileUtil.copy(generatedRestClientPath, targetDirectory.fsPath);
    vscode.window.showInformationMessage(
      "Successfully generated a MicroProfile REST Client interface template."
    );
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage(
      "Failed to generate a MicroProfile REST Client interface template."
    );
  } finally {
    // remove the tmp directory after if it exists
    if (tmpDirPath !== undefined && (await fileUtil.exists(tmpDirPath))) {
      try {
        await fileUtil.deleteDirectory(tmpDirPath);
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(`Failed to delete the directory ${tmpDirPath}`);
      }
    }
  }
}
