"use strict";
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const  pathExists= require("path-exists").sync;
const path = require("path");
const { isObject, formatPath } = require("@bc-cli/utils");
const getNpmInfo = require("@bc-cli/get-npm-info");
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

  //_bc-cli-l@1.0.0@bc-cli-l
  //_bc-cli-l@1.0.0@bc-cli-l
  //_bc-cli-l@1.0.0@_bc-cli-l


  //判断当前Package是否存在
  async exists() {
    if (this.storeDir) {
      if (this.packageVersion === "latest") {
        const versions = await getNpmInfo(this.packageName);
        return pathExists(path.resolve(this.storeDir,`_${this.packageName.replace('/','_')}@${versions[0]}@${this.packageName}`))
      }
    } else {
      return pathExists(this.targetPath);
    }
  }

  //安装Package
  async install() {
    await npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: "https://registry.npmjs.org",
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }

  //更新Package
  update() {
    console.log("11111111111");
  }

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
