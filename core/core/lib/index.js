const semver = require("semver");
const path = require("path");
const commander = require("commander");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExits = require("path-exists").sync;
const pkg = require("../package.json");
const log = require("@bc-cli/log");
const constant = require("./constant");
const exec = require("@bc-cli/exec");

const program = new commander.Command();
let args;

async function core() {
  try {
    //检查版本号
    // checkPkgVersion()

    //检查node版本号
    checkNodeVersion();

    //root账号启动检查和自动降级功能
    checkRoot();

    //检查用户主目录
    checkUserHome();

    //检查入参和debug模式开发
    // checkInputArgs();

    //检查环境变量
    checkEnv();

    //检查脚手架版本号
    // await checkGlobalUpdate();

    //初始化commander
    initCommander();
  } catch (error) {
    log.error(error.message);
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(error);
    }
  }
}

//检查版本号
function checkPkgVersion() {
  //npmlog库封装
  log.info("cli", pkg.version);
}

//检查node版本号（项目可能不支持低版本node）
function checkNodeVersion() {
  //当前node版本
  const currentVersion = process.version;
  //定义的最低node版本
  const lowestVersion = constant.LOWEST_VERSION;
  //semver比较版本号
  if (!semver.gte(currentVersion, lowestVersion)) {
    //colors颜色工具
    throw new Error(colors.red(`bc-cli 需要安装 v${lowestVersion}及以上版本`));
  }
}

//root账号启动检查和自动降级功能
function checkRoot() {
  //用户权限
  // console.log(process.geteuid());
  //root-check2.0用的是import export
  const rootCheck = require("root-check");
  rootCheck();
}

//检查用户主目录
function checkUserHome() {
  //用户主目录和是否存在
  if (!userHome || !pathExits(userHome)) {
    throw new Error(colors.red("当前登陆的用户主目录不存在!"));
  }
}

//检查入参和debug模式开发
function checkInputArgs() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2));
  checkArgs();
}
function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

//检查环境变量
function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExits(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultComfig();
  // log.info("config",process.env.CLI_HOME_PATH , process.env.BC_TEST);
}
function createDefaultComfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliConfig"] = path.resolve(userHome, paprocess.env.CLI_HOME);
  } else {
    cliConfig["cliConfig"] = path.resolve(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig["cliConfig"];
}

//检查脚手架版本号
async function checkGlobalUpdate() {
  //1.获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  //2.调用npm Api，获取所有版本号
  const getNpmInfo = require("@bc-cli/get-npm-info");
  const versions = await getNpmInfo(npmName);
  //3.提取所有版本号，比较那些版本号是大于当前版本号
  const version = versions && versions[0];
  //4.获取最新的版本号，提示用户更新到该版本
  if (semver.gt(version, currentVersion)) {
    log.info(
      "update",
      colors.yellow(`当前版本是${currentVersion},请升级到最新版本${version}`)
    );
  }
}
function initCommander() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [option]")
    .description("something...")
    .version(pkg.version);

  program.option("-d, --debug", "开启debug模式");
  program.option(
    "-tp, --targetPath <targetPath>",
    "是否指定本地调试文件路径",
    ""
  );
  program.option("-pv, --packVersion <packVersion>", "是否指定安装版本号", "");

  program
    .command("init")
    .usage("[projectName]")
    .description("init  projectName")
    .argument("[projectName]", "projectName")
    .option("-f, --force", false)
    .action(exec);

  program.on("option:debug", function () {
    const options = program.opts();
    if (options.debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
  });

  //on监听的只能是全局的option
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = program.opts().targetPath;
  });

  program.on("option:packVersion", function () {
    process.env.CLI_PACK_VERSION = program.opts().packVersion;
  });

  program.on("command:*", function (obj) {
    console.log("未知命令：" + obj[0]);
    console.log(
      "可用命令",
      program.commands.map((cmd) => cmd.name())
    );
  });
  program.parse();
}
module.exports = core;
