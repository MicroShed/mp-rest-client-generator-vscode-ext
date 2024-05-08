/**
 * Copyright (c) 2019, 2024 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";
import * as fs from "fs";
import * as fsExtra from "fs-extra";
import * as os from "os";
import * as path from "path";
import { GENERATOR_JAR_PATH, GENERATOR_JAR_URL } from "../constants";

interface DownloadRequestOptions {
  url: string;
}

// Downloads a file using streams to avoid loading entire file into memory
export async function downloadFile(
  requestOptions: DownloadRequestOptions,
  downloadLocation: string
): Promise<void> {
  const { url, ...options } = requestOptions;
  const res = await fetch(url, options);
  if (res.status >= 400 && res.status < 600) {
    throw new Error(`Bad response from server ${res.status}: ${res.statusText}`);
  }

  return new Promise((resolve, reject) => {
    if (res.body === null) {
      throw new Error("res.body is null");
    }
    // create a pipeline that pipes the response to the download location
    pipeline(res.body, fs.createWriteStream(downloadLocation), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export const exists = promisify(fs.exists);

const mkdtemp = promisify(fs.mkdtemp);
// generates a temp directory in a existing dir and returns the name of the tmp dir
export async function generateTempDirectory(): Promise<string> {
  const tmpDirPrefix = "vscode-rest-client-generator-";
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  return tmpDir;
}

export function copy(src: string, dest: string) {
  fsExtra.copySync(src, dest);
}

export const deleteDirectory = promisify(fsExtra.remove);
