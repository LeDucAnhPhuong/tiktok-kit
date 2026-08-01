'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { VENDORS, byId, DEFAULT_VENDOR_ID } = require('./vendors.js');
const { readJson, writeJson } = require('./settings-merge.js');
const tkConfig = require('./tk-config.js');

/**
 * Interactive connection wizard.
 *
 * Setup belongs in the CLI, not in a skill: pasting an API key into a chat session puts
 * it in the transcript and sends it to the model. Read here from a muted stdin, it never
 * leaves the machine. The skill's job is the part the CLI genuinely cannot do — calling
 * the MCP tools to see whether data actually flows.
 */

const MCP_FILE = () => path.join(process.cwd(), '.mcp.json');
const GITIGNORE = () => path.join(process.cwd(), '.gitignore');

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

/** Prompt without echoing the value, so secrets never land in scrollback. */
function askSecret(rl, question) {
  return new Promise((resolve) => {
    rl.stdoutMuted = true;
    rl.question(question, (a) => {
      rl.stdoutMuted = false;
      rl.output.write('\n');
      resolve(a.trim());
    });
  });
}

/** Single-choice prompt with a default, used where a vendor offers URL variants. */
async function askSelect(rl, prompt) {
  console.log(`\n${prompt.label}:`);
  prompt.select.forEach((opt, i) => {
    const mark = opt.value === prompt.default ? ' (default)' : '';
    console.log(`  ${i + 1}. ${opt.label}${mark}`);
  });
  const raw = await ask(rl, `Choose 1-${prompt.select.length} [${prompt.default}]: `);
  if (!raw) return prompt.default;
  const index = Number(raw);
  if (Number.isNaN(index) || index < 1 || index > prompt.select.length) return prompt.default;
  return prompt.select[index - 1].value;
}

function makeInterface() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl.stdoutMuted = false;
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = function (chunk) {
    if (rl.stdoutMuted) rl.output.write('*');
    else write(chunk);
  };
  return rl;
}

/**
 * The key is written in plaintext, so the file must never be committable by accident.
 * Returns what was done so the caller can say it out loud.
 */
function ensureGitignored() {
  const file = GITIGNORE();
  const entry = '.mcp.json';

  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    return { state: 'not-a-repo' };
  }
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current.split('\n').some((l) => l.trim() === entry)) return { state: 'already' };

  const prefix = current && !current.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(
    file,
    `${prefix}\n# Holds MCP credentials in plaintext — never commit.\n${entry}\n`,
    'utf8'
  );
  return { state: 'added' };
}

/** Merge one server into .mcp.json without disturbing servers the user already had. */
function writeMcpServer(name, definition) {
  const file = MCP_FILE();
  const current = readJson(file, {});
  current.mcpServers = current.mcpServers || {};
  const replaced = Boolean(current.mcpServers[name]);
  current.mcpServers[name] = definition;
  writeJson(file, current);
  return { file, replaced };
}

function recordPlanes(choice) {
  const config = tkConfig.read() || { ...tkConfig.DEFAULT_CONFIG };
  config.mcp = config.mcp || {};
  for (const plane of choice.planes) {
    config.mcp[plane] = { status: 'registered-but-empty', vendor: choice.vendor };
  }
  if (choice.suggestedBudget) {
    config.budget = config.budget || {};
    config.budget.maxQueriesPerRun = choice.suggestedBudget;
  }
  writeJson(tkConfig.configPath(), config);
  return config;
}

function printMenu() {
  console.log('\nAdvanced sources. TikTok official is already the default for ads —');
  console.log('the entries below exist mainly because it does not cover organic.\n');
  VENDORS.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.label}`);
    console.log(`     ${v.summary}`);
    console.log(`     ${v.caveat}`);
    console.log('');
  });
  console.log('  0. Skip for now\n');
}

/**
 * The default path: TikTok's own server, connected with no questions asked.
 *
 * It needs no API key and no developer app — the entry is a URL, and the user signs in
 * through the browser on first connect. Asking anything here would be ceremony.
 */
function connectOfficial({ variant = 'flat' } = {}) {
  const choice = byId(DEFAULT_VENDOR_ID);
  const { file, replaced } = writeMcpServer(choice.server, choice.build({ __variant: variant }));
  const config = recordPlanes(choice);

  console.log('');
  console.log(`  ${replaced ? 'updated' : 'connected'} TikTok Ads (official, ${variant}) in ${file}`);
  console.log('  no API key needed — you sign in through the browser on first connect');
  console.log(`  query budget: ${config.budget.maxQueriesPerRun} per run`);
  console.log('');
  console.log('Next:');
  console.log('  1. Restart Claude Code');
  console.log('  2. Approve the server and authorize with your TikTok for Business account');
  console.log('  3. Run /tk:connect to verify data is flowing');
  console.log('');
  console.log('Authorization lasts 30 days. Organic data needs a separate source:');
  console.log('  tk connect --advanced');
  return 0;
}

async function runConnect({ interactive = true, advanced = false, variant = 'flat' } = {}) {
  if (!advanced) return connectOfficial({ variant });

  if (!interactive || !process.stdin.isTTY) {
    console.log('tk: --advanced needs an interactive terminal.');
    return 1;
  }

  printMenu();
  const rl = makeInterface();

  try {
    const pick = await ask(rl, `Choose 0-${VENDORS.length}: `);
    const index = Number(pick);

    if (!index || Number.isNaN(index) || index < 1 || index > VENDORS.length) {
      console.log('\ntk: skipped. Run `tk connect` when you are ready.');
      return 0;
    }

    const choice = VENDORS[index - 1];
    console.log(`\n${choice.label}`);
    console.log(`Setup guide: ${choice.setupUrl}`);
    console.log(`Note: ${choice.caveat}\n`);

    const answers = {};
    for (const prompt of choice.prompts) {
      if (prompt.select) {
        answers[prompt.key] = await askSelect(rl, prompt);
        continue;
      }

      const value = prompt.secret
        ? await askSecret(rl, `${prompt.label}: `)
        : await ask(rl, `${prompt.label}: `);

      if (!value) {
        console.log('\ntk: empty value, aborting. Nothing was written.');
        return 1;
      }
      if (prompt.path && !fs.existsSync(value)) {
        console.log(`\ntk: "${value}" does not exist. Nothing was written.`);
        return 1;
      }
      answers[prompt.key] = value;
    }

    // Only guard .gitignore when the config actually holds a credential. The official
    // remote server authorizes in the browser, so its entry is just a URL.
    const holdsSecret = choice.prompts.some((p) => p.secret);
    const gitignore = holdsSecret ? ensureGitignored() : { state: 'not-needed' };

    const { file, replaced } = writeMcpServer(choice.server, choice.build(answers));
    const config = recordPlanes(choice);

    console.log('');
    console.log(`  ${replaced ? 'updated' : 'added'} server "${choice.server}" in ${file}`);
    if (gitignore.state === 'added') console.log('  added .mcp.json to .gitignore (it holds your key in plaintext)');
    else if (gitignore.state === 'already') console.log('  .mcp.json already gitignored');
    else if (gitignore.state === 'not-a-repo') console.log('  WARNING: not a git repo — .mcp.json holds your key in plaintext, keep it out of version control');
    else console.log('  no credential stored — the config holds only a URL');
    console.log(`  planes marked registered: ${choice.planes.join(', ')}`);
    console.log(`  query budget: ${config.budget.maxQueriesPerRun} per run`);
    if (choice.postNote) {
      console.log('');
      console.log(`  ${choice.postNote}`);
    }
    console.log('');
    console.log('Next: restart Claude Code, then run /tk:connect to verify data actually flows.');
    return 0;
  } finally {
    rl.close();
  }
}

module.exports = { runConnect, connectOfficial };
