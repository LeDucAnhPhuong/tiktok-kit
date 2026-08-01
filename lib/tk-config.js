'use strict';

const fs = require('fs');
const path = require('path');
const { tkConfigPath } = require('./paths.js');

/**
 * `.tk.json` records which MCP data planes are reachable and how much query budget
 * a single run may spend. It never holds credentials — those live in the MCP client
 * config or on the vendor platform, and `tk:connect` is forbidden from writing them
 * here.
 */
const DEFAULT_CONFIG = {
  $schema: './schemas/tk-config.schema.json',
  version: 1,
  mcp: {
    ads: { status: 'unregistered', vendor: null },
    organic: { status: 'unregistered', vendor: null },
    external: { status: 'unregistered', vendor: null },
  },
  account: {
    advertiserId: null,
    organicHandle: null,
  },
  budget: {
    maxQueriesPerRun: 12,
  },
  thresholds: {},
  paths: {
    reports: 'reports/tiktok',
  },
};

function read() {
  const file = tkConfigPath();
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`cannot parse ${file}: ${err.message}`);
  }
}

/** Create the config only when absent — never clobber a user's connection state. */
function ensure() {
  const file = tkConfigPath();
  if (fs.existsSync(file)) return { file, created: false };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, 'utf8');
  return { file, created: true };
}

function remove() {
  const file = tkConfigPath();
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file);
  return true;
}

module.exports = { DEFAULT_CONFIG, read, ensure, remove, configPath: tkConfigPath };
