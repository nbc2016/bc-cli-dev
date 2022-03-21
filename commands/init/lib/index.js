"use strict";
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const semver = require("semver");
const glob = require("glob");
const ejs = require("ejs");
const Command = require("@bc-cli/command");
const Package = require("@bc-cli/package");
const log = require("@bc-cli/log");
const { spinner, spawnAsync } = require("@bc-cli/utils");
const request = require("@bc-cli/request");

const WHITE_COMMAND = ["npm", "cnpm", "yarn"];

class initCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._argv[1].force;
    this.info = null;
  }
  async exec() {
    try {
      this.info = await this.prepare();
      if (!this.info) return;
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
          message: "当前文件夹不为空，是否继续创建项目",
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
      } else {
        return null;
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
    function validate(name) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        name
      );
    }
    const prompts = [
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
            if (!validate(v)) {
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
          value: {
            name: project.value,
            versions: project.versions,
            type: project.type,
            installCommand: project.installCommand,
            startCommand: project.startCommand,
          },
        })),
      },
    ];
    let projectInfo = {};
    if (validate(this.projectName)) {
      prompts.splice(1, 1);
      projectInfo.name = this.projectName;
    }
    const info = await inquirer.prompt(prompts);

    const { version } = await inquirer.prompt({
      type: "list",
      name: "version",
      message: "请选择项目模版版本",
      choices: info.template.versions.map((version) => ({
        value: version,
        name: version,
      })),
    });
    info.template.version = version;
    projectInfo = {
      ...info,
      ...projectInfo,
    };
    return projectInfo;
  }
  async downloadTemplate() {
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, "template");
    const storeDir = path.resolve(targetPath, "node_modules");
    const packageName = this.info.template.name;
    const packageVersion = this.info.template.version;
    const pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      const spinnerProgram = spinner("正在获取模版");
      await new Promise((res) =>
        setTimeout(() => {
          res();
        }, 1000)
      );
      spinnerProgram.stop(true);
      log.verbose("模板已存在");
    } else {
      const spinnerProgram = spinner("正在下载模版");
      await new Promise((res) =>
        setTimeout(() => {
          res();
        }, 1000)
      );
      await pkg.install();
      spinnerProgram.stop(true);
      log.verbose("下载完成");
    }
    const { template = {} } = this.info;
    if (!template.type) {
      template.type = "normal";
    }
    if (template.type === "normal") {
      await this.installNormalTemplate(
        path.resolve(pkg.storeDir, pkg.realPath, "template")
      );
    } else if (template.type === "custom") {
      await this.installCustomTemplate(path.resolve(pkg.storeDir, pkg.realPath, "template"),pkg);
    } else {
      throw new Error("未知的模版类型！");
    }
  }
  async ejsRender(ignore) {
    const dir = process.cwd();
    //不输出文件夹，只输出文件nodir: true
    return new Promise((resolve, reject) => {
      glob("**", { ignore: ignore, cwd: dir, nodir: true }, (err, files) => {
        if (err) {
          reject(err);
        } else {
          Promise.all(
            files.map((file) => {
              return new Promise((res, rej) => {
                ejs
                  .renderFile(
                    path.resolve(dir, file),
                    { className: this.info.name, version: this.info.version },
                    {}
                  )
                  .then((result) => {
                    fse.writeFileSync(path.resolve(dir, file), result);
                    res(result);
                  })
                  .catch((err) => {
                    rej(err);
                  });
              });
            })
          )
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    });
  }
  async execCommand(command, msg) {
    let res;
    const cmdList = command.split(" ");
    const cmd = WHITE_COMMAND.includes(cmdList[0]) ? cmdList[0] : null;
    const args = cmdList.slice(1);
    if (cmd) {
      res = await spawnAsync(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } else {
      throw new Error(`未知的命令 : ${cmd}`);
    }
    if (res !== 0) {
      throw new Error(msg);
    }
  }
  async installNormalTemplate(storeRealPath) {
    const spinnerProgram = spinner("正在下载模版");
    const cwdPath = process.cwd();
    fse.ensureDirSync(storeRealPath);
    fse.ensureDirSync(cwdPath);
    fse.copySync(storeRealPath, cwdPath);
    await new Promise((res) =>
      setTimeout(() => {
        res();
      }, 1000)
    );
    spinnerProgram.stop(true);
    await this.ejsRender(["public/**", "node_modules/**"]);
    log.info("bc-cli", "安装完毕");
    const { template = {} } = this.info;
    const { installCommand, startCommand } = template;
    await this.execCommand(installCommand, "安装失败");
    await this.execCommand(startCommand, "执行失败");
  }
  async installCustomTemplate(storeRealPath,pkg) {
    const spinnerProgram = spinner("正在下载模版");
    const cwdPath = process.cwd();
    fse.ensureDirSync(storeRealPath);
    fse.ensureDirSync(cwdPath);
    fse.copySync(storeRealPath, cwdPath);
    await new Promise((res) =>
      setTimeout(() => {
        res();
      }, 1000)
    );
    spinnerProgram.stop(true);
    const rootFilePath = pkg.getRootFilePath()
    if (fs.existsSync(rootFilePath)) {
      const code = `require('${rootFilePath}')(${JSON.stringify(this.info)})`
      await spawnAsync("node", ["-e",code], {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    }else {
      throw new Error("未找到执行文件")
    }
    const { template = {} } = this.info;
    const { installCommand, startCommand } = template;
    await this.execCommand(installCommand, "安装失败");
    await this.execCommand(startCommand, "执行失败");
  }
}
function init(argv) {
  new initCommand(argv);
}
module.exports = init;
