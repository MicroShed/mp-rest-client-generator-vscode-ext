# VS Code MicroProfile Rest Client Generator Extension
This is a MicroProfie VS Code extension that generates a MicroProfile Rest Client interface template from an OpenAPI `.yaml` file.  This extension makes use of the [openapi-generator](https://github.com/OpenAPITools/openapi-generator).  This extension will generate `models` and `apis` folders.

## Input
The extension takes in 3 parameters. 
1. Path or url to a `.yaml` file
2. Package path 
3. `src` directory of project to generate into

## Installing the Extension
- download the latest `mp-rest-client-generator-vscode-ext-0.0.x.vsix` file from [releases](https://github.com/dev-tools-for-enterprise-java/mp-rest-client-generator-vscode-ext/releases)
- from VS Code select `Install from vsix...` and select the `mp-rest-client-generator-vscode-ext-0.0.x.vsix` file

### Start the extension in debug mode
- Open this example in VS Code 1.25+
- `npm install`
- `npm run watch` or `npm run compile`
- `F5` to start debugging

## Contributing
Our [CONTRIBUTING](CONTRIBUTING.md) document contains details for submitting pull requests.