#!/usr/bin/env node
'use strict';

const importLocal = require("import-local")
console.log(__filename)
if (importLocal(__filename)) {
    console.log('run local');
}else {
    require(".");
}