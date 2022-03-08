"use strict";

const Package = require("@bc-cli/package");
const log = require("@bc-cli/log");
const path = require("path");

const SETTINGS = {
  init: "bc-cli-l",
};
const CATCH_DIR = "dependencies";
async function exec() {
  //1.targetPath -> modulePath
  //2.modulePath -> Package(npm模块)
  //3.Package.getRootFile(获取入口文件)
  //4.Package.update / Package.install'
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "latest";
  if (targetPath) {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
      require(rootFile)
    }
  } else {
    targetPath = path.resolve(homePath, CATCH_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    })
    if (pkg.exists()) {
      pkg.update()
    }else {
      await pkg.install()
      log.info(packageName,"下载完成")
    }
  }
}

module.exports = exec;
