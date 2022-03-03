#!/usr/bin/env node
'use strict';

const importLocal = require("import-local")
if (importLocal(__filename)) {
    console.log('run local');
}else {
    require(".");
}