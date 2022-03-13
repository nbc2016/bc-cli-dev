"use strict";
const Command = require("@bc-cli/command");
const log = require("@bc-cli/log");
class initCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._argv[1].force
    log.verbose("projectName",this.projectName)
    log.verbose("force",this.force)
  }
  exec() {
    console.log("init的业务");
  }
}
function init(argv) {
  new initCommand(argv);
}
module.exports = init;
