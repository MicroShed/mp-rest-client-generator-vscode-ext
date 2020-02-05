import * as vscode from "vscode";
import * as util from "../util/util";
import { GENERATE_FROM_YAML_FILE, GENERATE_FROM_YAML_URL } from "./constants";

export async function generateProject(fileUri): Promise<void> {
  const http = require("http");
  const fs = require("fs");
  const path = require("path");

  let fileSelected = fileUri;
  let fileSelectedUri = vscode.Uri.parse(fileSelected);

  // Prompt user to select whether to get .yaml file from url or file explorer
  this.yamlChoice = await util.specifyYamlChoice();
  if (this.yamlChoice === undefined) {
    console.error("Target folder not specified.");
    return;
  }
  if (this.yamlChoice === GENERATE_FROM_YAML_FILE.toLowerCase()) {
    this.yamlFile = await util.specifyTargetFile(); // Choose yaml file from file explorer
    if (this.yamlFile !== undefined) {
      this.yamlFile = vscode.Uri.parse(this.yamlFile).fsPath;
    } else {
      console.error("Target folder not specified.");
      return;
    }
  } else if (this.yamlChoice === GENERATE_FROM_YAML_URL.toLowerCase()) {
    this.yamlUrl = await util.specifyYamlPath();
    if (this.yamlUrl !== undefined) {
      var yamlFilePath = path.join(__dirname, "openapi.yaml");
      var request = http.get(this.yamlUrl, function(response) {
        // Download yaml file from url
        if (response.statusCode === 200) {
          var file = fs.createWriteStream(yamlFilePath);
          response.pipe(file);
        }
        request.setTimeout(12000, function() {
          request.abort();
        });
      });
      this.yamlFile = vscode.Uri.parse(yamlFilePath).fsPath;
    } else {
      console.error("yaml file not specified.");
      return;
    }
  }

  // prompt user to select which folder to generate into, if started from a file default ot the parent folder of that file
  if (fileSelectedUri) {
    this.assumeChoice = await util.specifyTargetFolder(fileSelectedUri);
    if (this.assumeChoice !== undefined) {
      this.srcDir = vscode.Uri.parse(this.assumeChoice).fsPath;
      this.package = await util.getPackageName(this.srcDir, path.sep);
    } else {
      console.error("Target folder not specified.");
    }
  } else {
    this.assumeChoice = await util.specifyTargetFolder(this.workspaceRootUri);
    if (this.assumeChoice !== undefined) {
      this.srcDir = vscode.Uri.parse(this.assumeChoice).fsPath;
      this.package = await util.getPackageName(this.srcDir, path.sep);
    } else {
      console.error("Target folder not specified.");
    }
  }

  if (
    this.package !== undefined &&
    this.yamlFile !== undefined &&
    this.srcDir !== undefined &&
    this.assumeChoice !== undefined
  ) {
    // Call MicroProfile generator
    this.packagePath = this.package.replace(/\./g, path.sep);
    var commands = [];
    var jarPath = __dirname + "/../openapi-generator-cli.jar";

    // execute the MicroProfile generator jar
    var jarCommand =
      "java -jar " +
      jarPath +
      " generate " +
      "-p useMultipart=false  " +
      "-i " +
      this.yamlFile +
      " -g java --library microprofile -o " +
      this.srcDir +
      "\
            --api-package " +
      this.package +
      ".api \
            --model-package " +
      this.package +
      ".models";
    commands.push(jarCommand);
  }

  if (commands && commands.length > 0) {
    // there are commands to run
    var exec = require("child_process").exec;
    function runCommands(array, srcDir, packagePath, callback) {
      var index = 0;
      var results = [];
      function next() {
        if (index < array.length) {
          exec(array[index++], function(err, stdout) {
            if (err) {
              return callback(err);
            }
            // do the next iteration
            results.push(stdout);
            next();
          });
        } else {
          callback(null, results, srcDir, packagePath);
        }
      }
      // start the first iteration
      next();
    }

    vscode.window.withProgress(
      // run the command with a "progress" dialog
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating the MicroProfile Rest Client interface template..."
      },
      async () => {
        return new Promise(resolve => {
          runCommands(commands, this.srcDir, this.packagePath, function(
            err,
            results,
            srcDir,
            packagePath
          ) {
            if (!err) {
              try {
                let generatedPath = path.resolve(
                  srcDir,
                  "src",
                  "main",
                  "java",
                  packagePath
                );

                // move models and apis folders to srcDir
                var ncp = require("ncp").ncp;
                ncp(generatedPath, srcDir, function(err) {
                  if (err) {
                    return console.error(err);
                  }
                  console.log("Moved " + generatedPath + " to " + srcDir);
                });

                // remove src dir created by generator
                util.deleteDirectory(path.resolve(srcDir, "src"));

                // remove .openapi-generator dir created by generator
                util.deleteDirectory(
                  path.resolve(srcDir, ".openapi-generator")
                );

                // remove pom.xml created by generator
                util.deleteFile(path.resolve(srcDir, "pom.xml"));

                // remove .openapi-generator created by generator
                util.deleteFile(
                  path.resolve(srcDir, ".openapi-generator-ignore")
                );

                // remove docs folder created by generator
                util.deleteDirectory(path.resolve(srcDir, "docs"));

                // remove README.md file created by generator
                util.deleteFile(path.resolve(srcDir, "README.md"));

                // remove yaml file path if downloaded from url
                if (fs.existsSync(yamlFilePath)) {
                  util.deleteFile(path.resolve(yamlFilePath));
                }
              } catch (error) {
                console.error(error);
              }
            }
            resolve();
            if (err) {
              console.error(err);
              vscode.window.showErrorMessage(
                "An error has occurred. Unable to generate a rest client in the specified directory.  Check the debug console for more information."
              );
            } else {
              vscode.window.showInformationMessage(
                "Successfully generated a MicroProfile Rest Client interface template."
              );
            }
          });
        });
      }
    );
  }
}
