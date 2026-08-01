#!/usr/bin/env node
'use strict';

const { runInit, runStatus, runRemove } = require('../lib/install.js');
const { runConnect } = require('../lib/connect.js');

const HELP = `
tk — TikTok Kit for Claude Code

Usage
  tk init [-g|--global]    Install kit assets, then walk through connecting your data
  tk init --no-connect     Install only, skip the connection wizard
  tk connect               Configure or change MCP access (vendor, keys)
  tk status                Show install mode, version, and connected data planes
  tk remove [-g|--global]  Remove kit assets and unregister
  tk --version             Print version

Notes
  Without -g, the kit installs into ./.claude of the current project.
  With -g, it installs into ~/.claude for every project.
  The wizard is skipped automatically when there is no interactive terminal.
  Keys go into .mcp.json on your machine, never into a Claude conversation.
  The kit is read-only: it never writes to TikTok.
`;

function parse(argv) {
  const args = argv.slice(2);
  const global = args.includes('-g') || args.includes('--global');
  const connect = !args.includes('--no-connect');
  const command = args.find((a) => !a.startsWith('-'));
  return { command, global, connect, args };
}

async function main() {
  const { command, global, connect, args } = parse(process.argv);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(require('../package.json').version);
    return 0;
  }

  switch (command) {
    case 'init':
      return runInit({ global, connect });
    case 'connect':
      return runConnect({ interactive: true });
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
