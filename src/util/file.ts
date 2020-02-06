import fetch from "node-fetch";
import { pipeline } from "stream";
import * as fs from "fs";
import { promisify } from "util";
import * as path from "path";
import * as ncp from "ncp";
import * as fsExtra from "fs-extra";

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

const _mkdir = promisify(fs.mkdir);
export async function mkdir(dir: string): Promise<void> {
  if (!(await exists(dir))) {
    await _mkdir(dir);
  }
}

// generates a temp directory in a existing dir and returns the name of the tmp dir
export async function generateTempDirectory(dir: string): Promise<string> {
  const randomSuffix = Math.random()
    .toString(36)
    .substr(2, 5);
  const tempDirName = `tmp-${randomSuffix}`;
  const fullTempDirPath = path.join(dir, tempDirName);
  await mkdir(fullTempDirPath);
  return fullTempDirPath;
}

export const copy = promisify(ncp);

export const deleteDirectory = promisify(fsExtra.remove);
