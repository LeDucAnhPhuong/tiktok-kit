#!/usr/bin/env node
'use strict';

const { runInit, runStatus, runRemove } = require('../lib/install.js');

const HELP = `
tk — TikTok Kit for Claude Code

Usage
  tk init [-g|--global]    Install kit assets and register the kit
  tk status                Show install mode, version, and connected data planes
  tk remove [-g|--global]  Remove kit assets and unregister
  tk --version             Print version

Notes
  Without -g, the kit installs into ./.claude of the current project.
  With -g, it installs into ~/.claude for every project.
  The kit is read-only: it never writes to TikTok, and never stores credentials.
`;

function parse(argv) {
  const args = argv.slice(2);
  const global = args.includes('-g') || args.includes('--global');
  const command = args.find((a) => !a.startsWith('-'));
  return { command, global, args };
}

async function main() {
  const { command, global, args } = parse(process.argv);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(require('../package.json').version);
    return 0;
  }

  switch (command) {
    case 'init':
      return runInit({ global });
    case 'status':
      return runStatus({ global });
    case 'remove':
      return runRemove({ global });
    case undefined:
    case 'help':
      console.log(HELP.trim());
      return 0;
    default:
      console.error(`tk: unknown command "${command}"`);
      console.error(HELP.trim());
      return 1;
  }
}

main()
  .then((code) => process.exit(code || 0))
  .catch((err) => {
    console.error(`tk: ${err.message}`);
    process.exit(1);
  });
