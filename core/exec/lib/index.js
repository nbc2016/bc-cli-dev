"use strict";

const Package = require("@bc-cli/package");
const log = require("@bc-cli/log");
const path = require("path");

const SETTINGS = {
  init: "bc-cli-l",
};
const CATCH_DIR = "dependencies";
async function exec() {
  try {
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
    const packageVersion = process.env.CLI_PACK_VERSION || "latest"

    if (targetPath) {
      pkg = new Package({
        targetPath,
        packageName,
        packageVersion,
      });
    } else {
      targetPath = path.resolve(homePath, CATCH_DIR);
      storeDir = path.resolve(targetPath, "node_modules");
      pkg = new Package({
        targetPath,
        storeDir,
        packageName,
        packageVersion,
      });
      if (await pkg.exists()) {
        // pkg.update();
      } else {
        await pkg.install();
      }
    }
    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
      require(rootFile);
      log.info(packageName, "执行完毕");
    } else {
      throw new Error("找不到目标文件")
    }
  } catch (error) {
    log.error(error.message);
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(error);
    }
  }
}

module.exports = exec;
