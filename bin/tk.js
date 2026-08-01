#!/usr/bin/env node
'use strict';

const { runInit, runStatus, runRemove } = require('../lib/install.js');
const { runConnect } = require('../lib/connect.js');

const HELP = `
tk — TikTok Kit for Claude Code

Usage
  tk init [-g|--global]    Install the kit and connect TikTok Ads. No questions asked
  tk init --layered        Connect the lighter ~40-tool server instead of the full one
  tk init --no-connect     Install only, do not touch .mcp.json
  tk connect               Reconnect or switch tool surface
  tk connect --advanced    Add other sources — organic data lives here
  tk status                Show install mode, version, and connected data planes
  tk remove [-g|--global]  Remove kit assets and unregister
  tk --version             Print version

Notes
  Connecting needs no API key: the config is a URL, and you sign in through the
  browser on first connect. Authorization lasts 30 days.
  Without -g, the kit installs into ./.claude of the current project.
  The kit is read-only: it never writes to TikTok.
`;

function parse(argv) {
  const args = argv.slice(2);
  const global = args.includes('-g') || args.includes('--global');
  const connect = !args.includes('--no-connect');
  const advanced = args.includes('--advanced');
  const variant = args.includes('--layered') ? 'layer' : 'flat';
  const command = args.find((a) => !a.startsWith('-'));
  return { command, global, connect, advanced, variant, args };
}

async function main() {
  const { command, global, connect, advanced, variant, args } = parse(process.argv);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(require('../package.json').version);
    return 0;
  }

  switch (command) {
    case 'init':
      return runInit({ global, connect, variant });
    case 'connect':
      return runConnect({ interactive: true, advanced, variant });
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
