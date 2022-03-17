"use strict";
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const userHome = require("fs-extra");
const semver = require("semver");
const Command = require("@bc-cli/command");
const Package = require("@bc-cli/package");
const log = require("@bc-cli/log");
const {spinner} = require("@bc-cli/utils");
const request = require("@bc-cli/request");

class initCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._argv[1].force;
    this.info = null;
  }
  async exec() {
    try {
      this.info = await this.prepare();
      if (!this.info) return
      log.verbose("info", JSON.stringify(this.info || {}));
      await this.downloadTemplate();
    } catch (error) {
      console.log(error);
      log.error(error);
    }
  }
  async prepare() {
    const { data } = await request.get("/project/template");
    if (!(data && data.length)) {
      throw new Error("获取模版失败");
    }
    //1.判断当前目录是否为空
    const localPath = process.cwd();
    let ifContinue = false;
    if (!this.isCwdEmpty(localPath)) {
      ifContinue = (
        await inquirer.prompt({
          type: "confirm",
          name: "ifContinue",
          default: false,
          message: "当亲文件夹不为空，是否继续创建项目",
        })
      ).ifContinue;
      if (!ifContinue) {
        return;
      }
    }
    //2.是否强制更新
    if (ifContinue || this.force) {
      const { confirmDelete } = await inquirer.prompt({
        type: "confirm",
        name: "confirmDelete",
        default: false,
        message: "是否确认清空当前目录下的文件",
      });
      if (confirmDelete) {
        fse.emptyDirSync(localPath);
      }else {
        return null
      }
    }
    //3.获取创建项目或者组件以及信息
    return this.getProjectInfo(data);
  }

  isCwdEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(
      (file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0
    );
    return !fileList || fileList.length === 0;
  }

  async getProjectInfo(data) {
    const info = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "请选择初始化类型",
        choices: [
          { value: "project", name: "项目" },
          { value: "component", name: "组件" },
        ],
      },
      {
        type: "input",
        name: "name",
        message: "请输入名字:",
        default: "",
        validate(v) {
          const done = this.async();
          setTimeout(function () {
            if (
              !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                v
              )
            ) {
              done("请输入合法名字");
              return;
            }
            done(null, true);
          }, 500);
        },
      },
      {
        type: "input",
        name: "version",
        message: "请输入版本号:",
        default: "1.0.0",
        validate(v) {
          const done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(v)) {
              done("请输入合法版本号");
              return;
            }
            done(null, true);
          }, 500);
        },
      },
      {
        type: "list",
        name: "template",
        message: "请选择项目模版",
        choices: data.map((project) => ({
          name: project.name,
          value: { name: project.value, version: project.version },
        })),
      },
    ]);
    return info;
  }
  async downloadTemplate() {
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, "template");
    const storeDir = path.resolve(targetPath, "node_modules");
    const packageName = this.info.template.name;
    const packageVersion = this.info.template.version;
    const pkg  = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })
    if ( await pkg.exists()) {
      log.verbose("模板已存在");
    }else {
      const spinnerProgram = spinner("正在下载模版")
      await new Promise(res => setTimeout(()=> { res()},1000))
      await pkg.install()
      spinnerProgram.stop()
      log.verbose("下载完成")
    }
  }
}
function init(argv) {
  new initCommand(argv);
}
module.exports = init;
