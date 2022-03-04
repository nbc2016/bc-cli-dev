#!/usr/bin/env node
'use strict';

const importLocal = require("import-local")
const npmLog = require("npmlog")

if (importLocal(__filename)) {
    npmLog.info("cli","run local")
}else {
    require(".")(process.argv.slice(2));
}