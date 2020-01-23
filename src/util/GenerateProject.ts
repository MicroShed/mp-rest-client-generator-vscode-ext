import * as vscode from "vscode";
import * as util from "../util/util";

export async function generateProject(fileUri): Promise<void> {
    let fileSelected = fileUri;
    let fileSelectedUri = vscode.Uri.parse(fileSelected);

    var http = require('http'),
        fs = require('fs');

    // Prompt user to select whether to get .yaml file from url or file explorer
    this.yamlChoice = await util.specifyYamlChoice();
    if (this.yamlChoice === undefined) {
        console.error("Target folder not specified.");
        return;
    }
    if (this.yamlChoice === "generate from .yaml file") {
        this.yamlFile = await util.specifyTargetFile(); // Choose yaml file from file explorer
        if (this.yamlFile !== undefined) {
            this.yamlFile = vscode.Uri.parse(this.yamlFile).fsPath;
            console.log("File selected: " + this.yamlFile);
        } else {
            console.error("Target folder not specified.");
            return;
        }
    } else if (this.yamlChoice === "generate from url") {
        this.yamlUrl = await util.specifyYamlPath();
        if (this.yamlUrl !== undefined) {
            var filePath = this.generatorDirectory + "openapi.yaml";
            var request = http.get(this.yamlUrl, function (response) {  // Download yaml file from url
                if (response.statusCode === 200) {
                    var file = fs.createWriteStream(filePath);
                    response.pipe(file);
                }
                request.setTimeout(12000, function () {
                    request.abort();
                });
            });
            this.yamlFile = vscode.Uri.parse(filePath).fsPath;
        } else {
            console.error("yaml file not specified.");
            return;
        }
    }

    const path = require('path');

    // prompt user to select which folder to generate into, if started from a file default ot the parent folder of that file
    if (fileSelectedUri) {
        this.assumeChoice = await util.specifyTargetFolder(fileSelectedUri);
        if (this.assumeChoice !== undefined) {
            this.srcDir = vscode.Uri.parse(this.assumeChoice).fsPath;
            console.log("Selected srcDir: " + this.srcDir);
            this.package = await util.getPackageName(this.srcDir, path.sep);
        } else {
            console.error("Target folder not specified.");
        }
    } else {
        this.assumeChoice = await util.specifyTargetFolder(this.workspaceRootUri);
        if (this.assumeChoice !== undefined) {
            this.srcDir = vscode.Uri.parse(this.assumeChoice).fsPath;
            console.log("Selected srcDir: " + this.srcDir);
            this.package = await util.getPackageName(this.srcDir, path.sep);
        } else {
            console.error("Target folder not specified.");
        }
    }

    if (this.package !== undefined && this.yamlFile !== undefined && this.srcDir !== undefined && this.assumeChoice !== undefined) {
        // Call MicroProfile generator
        this.packagePath = this.package.replace(/\./g, path.sep);
        var commands = [];
        var jarPath = __dirname + '/../openapi-generator-cli.jar';

        // execute the MicroProfile generator jar
        var jarCommand = 'java -jar ' + jarPath + ' generate '
            + '-p useMultipart=false \ '
            + '-i ' + this.yamlFile + ' -g java --library microprofile -o ' + this.srcDir + '\
            --api-package ' + this.package + '.api \
            --model-package ' + this.package + '.models';
        commands.push(jarCommand);
    }

    if (commands && commands.length > 0) {  // there are commands to run
        var exec = require('child_process').exec;
        function runCommands(array, srcDir, packagePath, callback) {
            var index = 0;
            var results = [];
            function next() {
                if (index < array.length) {
                    exec(array[index++], function (err, stdout) {
                        if (err) { return callback(err); }
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

        vscode.window.withProgress( // run the command with a "progress" dialog
            {
                location: vscode.ProgressLocation.Notification,
                title: "Generating the MicroProfile Rest Client interface template..."
            }, async () => {
                return new Promise((resolve) => {
                    runCommands(commands, this.srcDir, this.packagePath, function (err, results, srcDir, packagePath) {
                        if (!err) {
                            try {
                                let generatedPath = path.resolve(srcDir, 'src', 'main', 'java', packagePath);

                                // move models and apis folders to srcDir
                                var ncp = require('ncp').ncp;
                                ncp(generatedPath, srcDir, function (err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    console.log('Moved ' + generatedPath + ' to ' + srcDir);
                                });
            
                                // remove src dir created by generator
                                util.deleteDirectory(path.resolve(srcDir, 'src'));
            
                                // remove .openapi-generator dir created by generator
                                util.deleteDirectory(path.resolve(srcDir, '.openapi-generator'));
            
                                // remove pom.xml created by generator
                                util.deleteFile(path.resolve(srcDir, 'pom.xml'));
            
                                // remove .openapi-generator created by generator
                                util.deleteFile(path.resolve(srcDir, '.openapi-generator-ignore'));
            
                                // remove docs folder created by generator
                                util.deleteDirectory(path.resolve(srcDir, 'docs'));
            
                                // remove README.md file created by generator
                                util.deleteFile(path.resolve(srcDir, 'README.md'));
                            } catch (error) {
                                console.error(error);
                            }
                        }
                        resolve();
                        if (err) {
                            console.error(err);
                            vscode.window.showErrorMessage("An error has occurred. Unable to generate a rest client in the specified directory.  Check the debug console for more information.");
                        } else {
                            vscode.window.showInformationMessage("Successfully generated a MicroProfile Rest Client interface template.");
                        }
                    });
                });
		    }
	    );
    }
}

