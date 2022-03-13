'use strict';
const log = require("npmlog")

//根据环境判断等级 debugger
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"

//前缀
log.heading = "  李子🐶  "

//前缀样式
log.headingStyle = {fg:"brightYellow",bg:"green",bold:true}

//自定义
log.addLevel("success",2000,{fg:"green"})
module.exports = log;

