"use strict";
const path = require("path");
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
  const spinner = new require("cli-spinner").Spinner(`${msg} %s`)
  spinner.setSpinnerString(spinnerString)
  spinner.start()
  return spinner
}

module.exports = { isObject, formatPath, spinner };
