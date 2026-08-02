#!/usr/bin/env node
'use strict';

const { runInit, runStatus, runRemove } = require('../lib/install.js');
const { runConnect, authorize, DEFAULT_SERVER } = require('../lib/connect.js');

const HELP = `
tk — TikTok Kit for Claude Code

Usage
  tk init [-g|--global]    Install the kit and connect TikTok Ads. No questions asked
  tk init --layered        Connect the lighter ~40-tool server instead of the full one
  tk init --no-connect     Install only, do not register any MCP server
  tk init --lang vi|en     Set output language without being asked
  tk init --scope project  Register in .mcp.json so teammates get it via git
  tk init --no-auth        Skip the browser authorization step
  tk auth                  Authorize with TikTok (also re-auth after 30 days)
  tk auth --no-browser     Print the URL instead of opening a browser (SSH)
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
  const auth = !args.includes('--no-auth');
  const noBrowser = args.includes('--no-browser');
  const variant = args.includes('--layered') ? 'layer' : 'flat';
  const scopeArg = args[args.indexOf('--scope') + 1];
  const scope = args.includes('--scope') && scopeArg === 'project' ? 'project' : 'user';
  const langArg = args[args.indexOf('--lang') + 1];
  const lang = args.includes('--lang') && ['vi', 'en'].includes(langArg) ? langArg : null;
  const command = args.find((a) => !a.startsWith('-'));
  return { command, global, connect, advanced, variant, scope, lang, auth, noBrowser, args };
}

async function main() {
  const { command, global, connect, advanced, variant, scope, lang, auth, noBrowser, args } = parse(process.argv);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(require('../package.json').version);
    return 0;
  }

  switch (command) {
    case 'init':
      return runInit({ global, connect, variant, lang, scope, auth });
    case 'auth': {
      const r = authorize(DEFAULT_SERVER, { noBrowser });
      if (!r.ok) {
        console.error(`tk: authorization failed (${r.reason})`);
        console.error('    Is the server registered? Try `tk init` first.');
        return 1;
      }
      console.log('tk: authorized. Run /tk:connect in Claude Code to verify.');
      return 0;
    }
    case 'connect':
      return runConnect({ interactive: true, advanced, variant, scope });
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
