'use strict';
const urlJoin = require("url-join")
const  semver = require("semver")
const axios = require("axios")

async function getNpmInfo(npmName,registry) {
    if (!npmName) {
        return null
    }
    return await axios.get(urlJoin("https://registry.taobao.npm.org",npmName)).then(res => {
        if (res.status === 200) {
            const versionList = Object.keys(res.data.versions);
            versionList.sort((a,b) => semver.gt(b,a) ? 1 : -1 )
            return versionList
        }
        return null
    }).catch(error => {
        return Promise.reject(error)
    })
}
module.exports = getNpmInfo;
