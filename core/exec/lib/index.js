"use strict";
// const cp = require("child_process");
const path = require("path");
const Package = require("@bc-cli/package");
const log = require("@bc-cli/log");
const {spawnAsync} = require("@bc-cli/utils");

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
    const packageVersion = process.env.CLI_PACK_VERSION || "latest";

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
    // function spawn(command, arg, options) {
    //   let args = []
    //   if (process.platform === "win32") {
    //     command = "cmd"
    //     args.push(command)
    //   }
    //   args = args.concat(arg)
    //   const child = cp.spawn(command, args, options || {});
    //   child.on("error", (err) => {
    //     log.error("spwan", err);
    //     process.exit(1);
    //   });
    //   child.on("exit", (e) => {
    //     process.exit(e); 
    //   });
    // }
    if (rootFile) {
      // cp.spawn("node",["-e","scpipt"],{}) mac
      // cp.spawn("cmd",["node","-e","scpipt"],{}) win
      
      const code = `require('${rootFile}').call(null, ${JSON.stringify(Array.from(arguments).slice(0,2))})`;
 
      await spawnAsync("node", ["-e", code], { stdio: "inherit",cwd: process.cwd() });
  
      // require(rootFile).call(null,Array.from(arguments).slice(0,2))
      
    } else {
      throw new Error("找不到目标文件");
    }
  } catch (error) {
    log.error(error.message);
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(error);
    }
  }
}

module.exports = exec;
