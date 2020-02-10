import * as childProcess from "child_process";
import { promisify } from "util";

export const exec = promisify(childProcess.exec);
