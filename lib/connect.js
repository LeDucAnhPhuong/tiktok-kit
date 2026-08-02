'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { VENDORS, byId, DEFAULT_VENDOR_ID } = require('./vendors.js');
const { readJson, writeJson } = require('./settings-merge.js');
const { select } = require('./prompt-select.js');
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

/** Vendor-declared variant choice, rendered as an arrow-key list. */
async function askSelect(prompt) {
  return select({
    message: prompt.label,
    choices: prompt.select.map((o) => ({ value: o.value, label: o.label })),
    initial: Math.max(0, prompt.select.findIndex((o) => o.value === prompt.default)),
  });
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

/**
 * On Windows `claude` is a .cmd shim, which execFile cannot launch directly — it fails
 * with ENOENT. Going through the shell there is the difference between this working and
 * silently falling back on every Windows machine.
 */
function runClaude(args, opts = {}) {
  return spawnSync('claude', args, {
    shell: process.platform === 'win32',
    encoding: 'utf8',
    ...opts,
  });
}

function addViaClaudeCli(name, url, scope) {
  const r = runClaude(['mcp', 'add', '--transport', 'http', name, url, '--scope', scope], {
    stdio: 'pipe',
  });
  if (r.error) return { ok: false, reason: r.error.code || r.error.message };
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.status === 0) return { ok: true };
  if (/already exists/i.test(out)) return { ok: true, existed: true };
  return { ok: false, reason: out.trim().split('\n')[0] || `exit ${r.status}` };
}

/**
 * Hand the OAuth round trip to Claude Code's own CLI.
 *
 * `claude mcp login` runs the same handshake the /mcp menu does and stores the token
 * where Claude Code will look for it. This is why authorization can move into the CLI
 * at all: the kit is not obtaining a token, it is asking Claude Code to obtain its own.
 *
 * stdio is inherited so the user sees the prompt and can abandon it with Ctrl-C.
 */
function authorize(name, { noBrowser = false } = {}) {
  const args = ['mcp', 'login', name];
  if (noBrowser) args.push('--no-browser');
  const r = runClaude(args, { stdio: 'inherit' });
  if (r.error) return { ok: false, reason: r.error.code || r.error.message };
  return r.status === 0 ? { ok: true } : { ok: false, reason: `exit ${r.status}` };
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


/**
 * The one question init asks. Unlike the vendor menu this has no obvious right answer —
 * a team can reasonably want either — so it is worth a prompt. Non-interactive runs and
 * an explicit --lang skip it.
 */
async function selectLanguage({ interactive = true, lang = null } = {}) {
  const config = tkConfig.read() || { ...tkConfig.DEFAULT_CONFIG };
  config.locale = config.locale || {};

  let chosen = lang;

  if (!chosen && interactive) {
    chosen = await select({
      message: 'Language for skill and agent output',
      choices: [
        { value: 'vi', label: 'Tiếng Việt', hint: 'metric names and numbers stay in English' },
        { value: 'en', label: 'English' },
      ],
    });
  }

  config.locale.responseLanguage = chosen || 'vi';
  writeJson(tkConfig.configPath(), config);

  console.log(
    config.locale.responseLanguage === 'vi'
      ? '  output language: Tiếng Việt (metric names and numbers stay in English)'
      : '  output language: English'
  );
  return config.locale.responseLanguage;
}

/**
 * The default path: TikTok's own server, connected with no questions asked.
 *
 * It needs no API key and no developer app — the entry is a URL, and the user signs in
 * through the browser on first connect. Asking anything here would be ceremony.
 */
function connectOfficial({ variant = 'flat', scope = 'user', auth = true } = {}) {
  const choice = byId(DEFAULT_VENDOR_ID);
  const definition = choice.build({ __variant: variant });

  const viaCli = scope === 'user' ? addViaClaudeCli(choice.server, definition.url, 'user') : { ok: false };
  let where;
  let needsApproval;

  if (viaCli.ok) {
    where = `~/.claude.json (user scope)${viaCli.existed ? ' — already present' : ''}`;
    needsApproval = false;
  } else {
    const { file, replaced } = writeMcpServer(choice.server, definition);
    where = `${file}${replaced ? ' (replaced)' : ''}`;
    needsApproval = true;
    if (scope === 'user' && viaCli.reason) {
      console.log(`\n  note: claude CLI unavailable (${viaCli.reason}) — wrote a project .mcp.json instead`);
    }
  }

  const config = recordPlanes(choice);

  console.log('');
  console.log(`  connected TikTok Ads (official, ${variant}) → ${where}`);
  console.log('  no API key needed — you sign in through the browser on first connect');
  console.log(`  query budget: ${config.budget.maxQueriesPerRun} per run`);
  console.log('');

  // Authorization can only be done by Claude Code itself, but it does not have to be
  // done from inside a session — `claude mcp login` runs the same handshake.
  let authorized = false;
  if (auth && viaCli.ok && process.stdin.isTTY) {
    console.log('Opening your browser to authorize with TikTok for Business...');
    console.log('(Ctrl-C to skip and do it later with `tk auth`)');
    console.log('');
    const result = authorize(choice.server);
    authorized = result.ok;
    if (!result.ok) {
      console.log(`\n  authorization not completed (${result.reason}) — run \`tk auth\` when ready`);
    }
  }

  const steps = [];
  if (!authorized) {
    if (needsApproval) {
      steps.push(
        'Approve the project MCP server when Claude Code asks\n' +
          '     (`tk init --scope user` avoids this gate entirely)'
      );
    }
    steps.push('Run  tk auth  to authorize with TikTok, or /mcp inside Claude Code');
  }
  steps.push('Open Claude Code (restart it if already running) and run  /tk:connect');

  console.log('');
  if (authorized) console.log('Authorized. Next:');
  else console.log('Next:');
  steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

  console.log('');
  console.log('Authorization lasts 30 days — run `tk auth` again when a live plane goes quiet.');
  console.log('Organic data needs a separate source:  tk connect --advanced');
  return 0;
}

async function runConnect({ interactive = true, advanced = false, variant = 'flat', scope = 'user' } = {}) {
  if (!advanced) return connectOfficial({ variant, scope });

  if (!interactive || !process.stdin.isTTY) {
    console.log('tk: --advanced needs an interactive terminal.');
    return 1;
  }

  console.log('\nAdvanced sources. TikTok official is already the default for ads —');
  console.log('the entries below exist mainly because it does not cover organic.');

  const picked = await select({
    message: 'Add a data source',
    choices: [
      ...VENDORS.map((v) => ({ value: v.id, label: v.label, hint: v.summary })),
      { value: null, label: 'Skip for now' },
    ],
  });

  if (!picked) {
    console.log('tk: skipped. Run `tk connect --advanced` when you are ready.');
    return 0;
  }

  const choice = byId(picked);
  const rl = makeInterface();

  try {
    console.log(`\n${choice.label}`);
    console.log(`Setup guide: ${choice.setupUrl}`);
    console.log(`Note: ${choice.caveat}\n`);

    const answers = {};
    for (const prompt of choice.prompts) {
      if (prompt.select) {
        answers[prompt.key] = await askSelect(prompt);
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

module.exports = { runConnect, connectOfficial, selectLanguage, authorize, DEFAULT_SERVER: 'tiktok-ads' };
