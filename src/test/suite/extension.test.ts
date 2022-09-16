/**
 * Copyright (c) 2019 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { expect } from "chai";

const MP_RC_GENERATOR_IDENTIFIER = "MicroProfile-Community.mp-rest-client-generator-vscode-ext";
const MP_RC_GENERATOR_COMMAND = "microprofile.restclient.generate";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../extension';

describe("VS Code extension", () => {
  it("should be present", () => {
    expect(vscode.extensions.getExtension(MP_RC_GENERATOR_IDENTIFIER)).to.exist;
  });

  it("should register an activation event", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const extensionPackageJSON = vscode.extensions.getExtension(MP_RC_GENERATOR_IDENTIFIER)!
      .packageJSON;

    expect(extensionPackageJSON.activationEvents).to.include(
      `onCommand:${MP_RC_GENERATOR_COMMAND}`,
      `The ${MP_RC_GENERATOR_COMMAND} command is not registered as an activation event in package.json`
    );
  });
});
