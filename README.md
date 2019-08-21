# VS Code MicroProfile Generator Extension
This is a MicroProfie vscode extension that generates a MicroProfile rest client interface template from an OpenAPI .yaml file.  This extension makes use of the [openapi-generator](https://github.com/OpenAPITools/openapi-generator).  The extension will generate `models` and `apis` folders.

## Input
The extension takes in 3 parameters. 
1. Path or url to a `.yaml` file
2. Package path 
3. `src` directory of project to generate into

## Installing the Extension
- download the latest `vscode-microprofile-generator-0.0.x.vsix` file
- from VS Code select `Install from vsix...` and select the `vscode-microprofile-generator-0.0.x.vsix` file

### Start the extension in debug mode
- Open this example in VS Code 1.25+
- `npm install`
- `npm run watch` or `npm run compile`
- `F5` to start debugging
