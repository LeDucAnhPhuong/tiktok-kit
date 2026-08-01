'use strict';

const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT, PAYLOAD_ROOT, targetRoot, settingsPath } = require('./paths.js');
const { readJson, applyPayload, revertPayload } = require('./settings-merge.js');
const tkConfig = require('./tk-config.js');
const ck = require('./detect-ck.js');
const { connectOfficial } = require('./connect.js');

const PAYLOAD_SETTINGS_FILE = path.join(PAYLOAD_ROOT, 'settings.json');
const METADATA_FILE = path.join(PAYLOAD_ROOT, 'metadata.json');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function payloadSettings() {
  return readJson(PAYLOAD_SETTINGS_FILE, {});
}

function metadata() {
  return readJson(METADATA_FILE, { version: '0.0.0', deletions: [] });
}

/** List payload files as paths relative to the payload root. */
function payloadFiles(dir = PAYLOAD_ROOT, base = PAYLOAD_ROOT) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...payloadFiles(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/**
 * Remove files this kit shipped in an earlier version. Without this, a renamed skill
 * leaves its old copy behind on every machine that upgrades, and Claude Code loads
 * both.
 */
function applyDeletions(root, deletions) {
  let removed = 0;
  for (const rel of deletions || []) {
    const target = path.join(root, rel);
    if (!target.startsWith(root)) continue; // refuse to escape the target root
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}

function copyPayload(root) {
  let copied = 0;
  for (const rel of payloadFiles()) {
    // settings.json is merged, not copied — copying would clobber other kits.
    if (rel === 'settings.json') continue;
    const src = path.join(PAYLOAD_ROOT, rel);
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied += 1;
  }
  return copied;
}

/** True once any plane has been pointed at a vendor, so re-running init stays quiet. */
function alreadyConfigured() {
  try {
    const config = tkConfig.read();
    if (!config || !config.mcp) return false;
    return Object.values(config.mcp).some((p) => p && p.vendor);
  } catch {
    return false;
  }
}

async function runInit({ global, connect = true, variant = 'flat' }) {
  const root = targetRoot({ global });
  const meta = metadata();
  const settingsFile = settingsPath({ global });
  const detected = ck.detect();
  const runStamp = stamp();

  if (detected.warning) console.warn(`tk: ${detected.warning}`);

  fs.mkdirSync(root, { recursive: true });

  const deleted = applyDeletions(root, meta.deletions);
  const copied = copyPayload(root);

  const payload = payloadSettings();
  const { backupPath, installedSettings } = applyPayload(settingsFile, payload, runStamp);

  let registration = { ok: false, reason: 'standalone' };
  if (detected.mode === 'coexist') {
    registration = ck.register(detected.configPath, installedSettings);
    if (!registration.ok) {
      console.warn(`tk: could not register with ClaudeKit (${registration.reason}); continuing standalone`);
    }
  }

  const config = tkConfig.ensure();

  console.log(`tk: installed v${meta.version} into ${root}`);
  console.log(`    ${copied} file(s) copied${deleted ? `, ${deleted} stale file(s) removed` : ''}`);
  if (backupPath) console.log(`    settings backed up to ${backupPath}`);
  console.log(`    mode: ${detected.mode}${registration.ok ? ` (registered as "${ck.KIT_NAME}")` : ''}`);
  console.log(`    config: ${config.file}${config.created ? ' (created)' : ' (existing, untouched)'}`);

  if (!connect) {
    console.log('');
    console.log('Next: run `tk connect` to connect TikTok Ads.');
    return 0;
  }

  if (alreadyConfigured()) {
    console.log('');
    console.log('TikTok already connected. `tk connect` to reconnect, `tk connect --advanced` to add organic.');
    return 0;
  }

  // No prompts and no secrets, so this runs unattended too — there is nothing to ask.
  return connectOfficial({ variant });
}

function runStatus({ global }) {
  const root = targetRoot({ global });
  const meta = metadata();
  const detected = ck.detect();

  console.log(`tk ${require(path.join(PACKAGE_ROOT, 'package.json')).version}`);
  console.log(`  payload version : ${meta.version}`);
  console.log(`  target root     : ${root}${fs.existsSync(root) ? '' : ' (not installed)'}`);
  console.log(`  claudekit       : ${detected.mode === 'coexist' ? `detected at ${detected.configPath}` : 'not detected'}`);

  let config = null;
  try {
    config = tkConfig.read();
  } catch (err) {
    console.log(`  config          : unreadable (${err.message})`);
  }

  if (!config) {
    console.log('  config          : absent — run `tk init`');
    return 0;
  }

  console.log(`  config          : ${tkConfig.configPath()}`);
  console.log('  data planes:');
  for (const [plane, state] of Object.entries(config.mcp || {})) {
    const vendor = state.vendor ? ` via ${state.vendor}` : '';
    console.log(`    ${plane.padEnd(9)} ${state.status}${vendor}`);
  }
  console.log(`  query budget    : ${config.budget?.maxQueriesPerRun ?? 'unset'} per run`);
  return 0;
}

function runRemove({ global }) {
  const root = targetRoot({ global });
  const settingsFile = settingsPath({ global });
  const detected = ck.detect();

  let removed = 0;
  for (const rel of payloadFiles()) {
    if (rel === 'settings.json') continue;
    const target = path.join(root, rel);
    if (fs.existsSync(target)) {
      fs.rmSync(target);
      removed += 1;
    }
  }

  const { removed: settingsRemoved } = revertPayload(settingsFile, payloadSettings());
  if (detected.mode === 'coexist') ck.unregister(detected.configPath);

  console.log(`tk: removed ${removed} file(s) from ${root}`);
  console.log(`    ${settingsRemoved} settings entr(ies) reverted`);
  console.log(`    .tk.json left in place — delete it manually if you want the connection state gone`);
  return 0;
}

module.exports = { runInit, runStatus, runRemove, payloadFiles, alreadyConfigured };
