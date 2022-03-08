"use strict";
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const path = require("path");
const { isObject, formatPath } = require("@bc-cli/utils");
const { log } = require("console");
class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的options参数不能为空");
    }
    if (!isObject(options)) {
      throw new Error("Package类的options参数必须为对象！");
    }
    // package路径
    this.targetPath = options.targetPath;
    // package的存储路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package的version
    this.packageVersion = options.packageVersion;
  }

  //判断当前Package是否存在
  exists() {}

  //安装Package
  async install() {
    await npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: 'https://registry.npmjs.org',
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion,
      }],
    });
  }

  //更新Package
  update() {}

  //获取入口文件路径
  getRootFilePath() {
    //1.获取package.json所在目录
    const dir = pkgDir(this.targetPath);
    if (dir) {
      //2.读取package.json
      const pkgFile = require(path.resolve(dir, "package.json"));
      //寻找main/lib
      if (pkgFile && pkgFile.main) {
        return formatPath(path.resolve(dir, pkgFile.main));
      }
    }
    return null;
  }
}

module.exports = Package;
