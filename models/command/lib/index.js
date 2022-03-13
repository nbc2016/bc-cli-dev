"use strict";
const semver = require("semver");
const colors = require("colors/safe");
const log = require("@bc-cli/log");
const LOWEST_VERSION = "13.0.0";
class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("argv不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("argv必须是个数组");
    }
    this._argv = argv;

    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      // chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((err) => {
        log.error(err);
      });
    });
  }
  checkNodeVersion() {
    //当前node版本
    const currentVersion = process.version;
    //定义的最低node版本
    const lowestVersion = LOWEST_VERSION;
    //semver比较版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
      //colors颜色工具
      throw new Error(
        colors.red(`bc-cli 需要安装 v${lowestVersion}及以上版本`)
      );
    }
  }
  // initArgs() {
  //     this._argv = this._argv.slice(0,this._argv.length -1)
  // }
  init() {
    throw new Error("必须自定义init");
  }
  exec() {
    throw new Error("必须自定义exec");
  }
}

module.exports = Command;
