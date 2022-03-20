"use strict";
const path = require("path");
const cp = require("child_process");

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
function formatPath(p) {
  const sep = path.sep;
  if (p && typeof p === "string") {
    if (sep !== "/") {
      return p.replace(/\\/g, "/");
    }
  }
  return p;
}
function spinner(msg, spinnerString = "|-\\") {
  const spinner = new require("cli-spinner").Spinner(`${msg} %s`);
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}

function spawnAsync(command, arg, options) {
  return new Promise((resolve, reject) => {
    let args = [];
    if (process.platform === "win32") {
      command = "cmd";
      args.push(command);
    }
    args = args.concat(arg);
    const child = cp.spawn(command, args, options || {});
    child.on("error", (err) => {
      log.error("spwan", err);
      reject(1);
      process.exit(1);
    });
    child.on("exit", (e) => {
      resolve(e);
      // process.exit(e);
    });
  });
}

module.exports = { isObject, formatPath, spinner, spawnAsync };
