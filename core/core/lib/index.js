const semver = require("semver")
const colors = require("colors/safe")
const userHome =require("user-home")
const pathExits = require("path-exists").sync
const pkg = require("../package.json")
const log = require("@bc-cli/log")
const constant = require("./constant")

function core(argv) {
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
    } catch (error) {
        log.error(error.message)
    }
}

//检查版本号
function checkPkgVersion() {
    //npmlog库封装
    log.info("cli", pkg.version)
}

//检查node版本号（项目可能不支持低版本node）
function checkNodeVersion() {
    //当前node版本
    const currentVersion = process.version
    //定义的最低node版本
    const lowestVersion = constant.LOWEST_VERSION
    //semver比较版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
        //colors颜色工具
        throw new Error(colors.red(`bc-cli 需要安装 v${lowestVersion}及以上版本`))
    }
}

//root账号启动检查和自动降级功能
function checkRoot(){
    //用户权限
    // console.log(process.geteuid());
    //root-check2.0用的是import export
    const rootCheck = require("root-check")
    rootCheck()
}

//检查用户主目录
function checkUserHome() {
    if (!userHome || !pathExits(userHome)) {
        throw new Error(colors.red("当前登陆的用户主目录不存在!"))
    }
}

module.exports = core
