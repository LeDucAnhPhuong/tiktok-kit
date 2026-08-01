'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const KIT_NAME = 'TikTok Kit';

/**
 * ClaudeKit writes a `kits` map into .ck.json when it installs a kit. That key is
 * not in ck's published config schema, so it is an observed contract, not a
 * guaranteed one. Every read and write of it is defensive: any failure degrades to
 * standalone mode rather than aborting the install.
 */
function findCkConfig() {
  const candidates = [
    path.join(process.cwd(), '.claude', '.ck.json'),
    path.join(os.homedir(), '.claude', '.ck.json'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function detect() {
  const configPath = findCkConfig();
  if (!configPath) return { mode: 'standalone', configPath: null };
  try {
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { mode: 'coexist', configPath };
  } catch (err) {
    return { mode: 'standalone', configPath: null, warning: `.ck.json unreadable (${err.message}); continuing standalone` };
  }
}

/** Add or refresh this kit's entry in ck's `kits` registry. Never throws. */
function register(configPath, installedSettings) {
  if (!configPath) return { ok: false, reason: 'no ck config' };
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    config.kits = config.kits || {};
    config.kits[KIT_NAME] = { installedSettings };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/** Drop this kit's entry. Never throws. */
function unregister(configPath) {
  if (!configPath) return { ok: false, reason: 'no ck config' };
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.kits || !config.kits[KIT_NAME]) return { ok: true, reason: 'not registered' };
    delete config.kits[KIT_NAME];
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

module.exports = { KIT_NAME, detect, register, unregister };
