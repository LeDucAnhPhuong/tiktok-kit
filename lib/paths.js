'use strict';

const os = require('os');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PAYLOAD_ROOT = path.join(PACKAGE_ROOT, 'claude');

/** Where kit assets land: ~/.claude when global, ./.claude otherwise. */
function targetRoot({ global }) {
  return global
    ? path.join(os.homedir(), '.claude')
    : path.join(process.cwd(), '.claude');
}

/** Project-level kit config. Always project-local, even for a global install. */
function tkConfigPath() {
  return path.join(process.cwd(), '.claude', '.tk.json');
}

/** Claude Code settings file inside the chosen target root. */
function settingsPath(opts) {
  return path.join(targetRoot(opts), 'settings.json');
}

module.exports = {
  PACKAGE_ROOT,
  PAYLOAD_ROOT,
  targetRoot,
  tkConfigPath,
  settingsPath,
};
