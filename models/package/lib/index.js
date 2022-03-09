"use strict";
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const pathExists = require("path-exists").sync;
const fsExtra = require("fs-extra");
const path = require("path");
const { isObject, formatPath } = require("@bc-cli/utils");
const getNpmInfo = require("@bc-cli/get-npm-info");
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

    this.realPath = "";
  }

  //_bc-cli-l@1.0.0@bc-cli-l

  mkdir() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirpSync(this.storeDir);
    }
  }

  async getRealPath() {
    if (this.packageVersion === "latest") {
      const versions = await getNpmInfo(this.packageName);
      this.packageVersion = versions[0]
    }
    this.realPath = `_${this.packageName.replace("/", "_")}@${this.packageVersion}@${
      this.packageName
    }`;
  }

  //判断当前Package是否存在
  async exists() {
    if (this.storeDir) {
      this.mkdir();
      await this.getRealPath();
      return pathExists(path.resolve(this.storeDir, this.realPath));
    }
    return null;
  }

  //安装Package
  async install() {
    this.mkdir();
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

  //获取入口文件路径
  getRootFilePath() {
    function getRootFile(targetPath) {
      //1.获取package.json所在目录
      const dir = pkgDir(targetPath);
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
    if (this.storeDir) {
      return getRootFile(path.resolve(this.storeDir, this.realPath));
    } else if (this.targetPath) {
      return getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
