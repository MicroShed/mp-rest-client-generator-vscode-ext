/**
 * Copyright (c) 2019, 2024 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { promisify } from "util";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // Download VS Code, unzip it and run the integration test
    let tmpDir = await generateTempDirectory();
    await runTests({ launchArgs: ["--user-data-dir", tmpDir], extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

const mkdtemp = promisify(fs.mkdtemp);
export async function generateTempDirectory(): Promise<string> {
  const tmpDirPrefix = "rest-client-generator-test-";
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  return tmpDir;
}
main();
