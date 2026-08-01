#!/usr/bin/env node
'use strict';

/**
 * End-to-end install check in a throwaway directory: standalone mode, idempotency,
 * coexist-with-ClaudeKit mode, and clean removal.
 *
 * The coexist case is the one that matters most — two installers writing the same
 * settings without knowing about each other is the highest-severity failure this kit
 * can cause on a user's machine.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'tk.js');

let failed = 0;

function check(label, condition) {
  console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${label}`);
  if (!condition) failed += 1;
}

function tk(cwd, ...args) {
  return execFileSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => {
    const full = path.join(dir, e.name);
    return n + (e.isDirectory() ? countFiles(full) : 1);
  }, 0);
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-smoke-'));
  console.log(`smoke-install in ${tmp}\n`);

  // --- standalone ---
  const a = path.join(tmp, 'standalone');
  fs.mkdirSync(a);
  tk(a, 'init', '--scope', 'project');
  const claudeA = path.join(a, '.claude');
  check('standalone: payload installed', fs.existsSync(path.join(claudeA, 'metadata.json')));
  check('standalone: skills installed', fs.existsSync(path.join(claudeA, 'skills', 'tk-connect', 'SKILL.md')));
  check('standalone: agents installed', fs.existsSync(path.join(claudeA, 'agents', 'tiktok-data-analyst.md')));
  check('standalone: .tk.json created', fs.existsSync(path.join(claudeA, '.tk.json')));
  check('standalone: no empty settings.json', !fs.existsSync(path.join(claudeA, 'settings.json')));

  const firstCount = countFiles(claudeA);
  tk(a, 'init', '--scope', 'project');
  check('idempotent: re-init adds nothing', countFiles(claudeA) === firstCount);
  check('status: runs clean', tk(a, 'status').includes('data planes'));

  // Connecting asks nothing and stores no secret, so a plain `tk init` must produce a
  // working .mcp.json even with no terminal attached.
  const mcpA = readJson(path.join(a, '.mcp.json'));
  check('connect: .mcp.json written unattended', Boolean(mcpA));
  check('connect: official server entry', mcpA?.mcpServers?.['tiktok-ads']?.url?.includes('open_mcp/tt-ads-mcp-flat'));
  check('connect: type http for remote server', mcpA?.mcpServers?.['tiktok-ads']?.type === 'http');
  check('connect: no credential stored', !mcpA?.mcpServers?.['tiktok-ads']?.env);

  const c = path.join(tmp, 'layered');
  fs.mkdirSync(c);
  tk(c, 'init', '--layered', '--scope', 'project');
  const mcpC = readJson(path.join(c, '.mcp.json'));
  check('--layered: picks the lighter server', mcpC?.mcpServers?.['tiktok-ads']?.url?.includes('tt-ads-mcp-layer'));

  const cfgA = readJson(path.join(a, '.claude', '.tk.json'));
  check('language: defaults to vi unattended', cfgA?.locale?.responseLanguage === 'vi');

  const e = path.join(tmp, 'lang-en');
  fs.mkdirSync(e);
  tk(e, 'init', '--lang', 'en', '--no-connect');
  check('--lang en: honoured', readJson(path.join(e, '.claude', '.tk.json'))?.locale?.responseLanguage === 'en');

  const d = path.join(tmp, 'no-connect');
  fs.mkdirSync(d);
  const optedOut = tk(d, 'init', '--no-connect');
  check('--no-connect: points at tk connect', optedOut.includes('tk connect'));
  check('--no-connect: payload still installed', fs.existsSync(path.join(d, '.claude', 'metadata.json')));
  check('--no-connect: no .mcp.json touched', !fs.existsSync(path.join(d, '.mcp.json')));

  // --- coexist ---
  const b = path.join(tmp, 'coexist');
  fs.mkdirSync(path.join(b, '.claude'), { recursive: true });
  const ckPath = path.join(b, '.claude', '.ck.json');
  const ckBefore = {
    codingLevel: -1,
    kits: {
      'ClaudeKit Engineer': {
        installedSettings: { hooks: ['node $HOME/.claude/hooks/session-init.cjs'], mcpServers: [] },
      },
    },
  };
  fs.writeFileSync(ckPath, JSON.stringify(ckBefore, null, 2));

  const out = tk(b, 'init');
  const ckAfter = JSON.parse(fs.readFileSync(ckPath, 'utf8'));
  check('coexist: detected ClaudeKit', out.includes('coexist'));
  check('coexist: TikTok Kit registered', Boolean(ckAfter.kits['TikTok Kit']));
  check('coexist: ck kit entry intact', ckAfter.kits['ClaudeKit Engineer'].installedSettings.hooks.length === 1);
  check('coexist: unrelated ck fields intact', ckAfter.codingLevel === -1);

  tk(b, 'remove');
  const ckRemoved = JSON.parse(fs.readFileSync(ckPath, 'utf8'));
  check('remove: TikTok Kit unregistered', !ckRemoved.kits['TikTok Kit']);
  check('remove: ck kit entry survived', Boolean(ckRemoved.kits['ClaudeKit Engineer']));
  check('remove: payload gone', !fs.existsSync(path.join(b, '.claude', 'metadata.json')));

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(`\n${failed ? `${failed} check(s) failed` : 'all install checks passed'}`);
  return failed ? 1 : 0;
}

process.exit(main());
