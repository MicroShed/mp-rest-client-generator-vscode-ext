import fetch from "node-fetch";
import { pipeline } from "stream";
import * as fs from "fs";
import { promisify } from "util";
import * as path from "path";
import * as ncp from "ncp";
import * as fsExtra from "fs-extra";
import * as os from "os";

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

const _mkdtemp = promisify(fs.mkdtemp);
export async function mkdtemp(dir: string): Promise<string | undefined> {
  if (!(await exists(dir))) {
    return await _mkdtemp(dir);
  }
}

// generates a temp directory in a existing dir and returns the name of the tmp dir
export async function generateTempDirectory(): Promise<string | undefined> {
  const tmpDirPrefix = "vscode-rest-client-generator-";
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), tmpDirPrefix));
  return tmpDir;
}

export const copy = promisify(ncp);

export const deleteDirectory = promisify(fsExtra.remove);
