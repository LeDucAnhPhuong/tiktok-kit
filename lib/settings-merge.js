'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Settings merging is additive and value-deduped so re-running `tk init` is a no-op.
 * Nothing owned by another kit is ever removed or rewritten.
 *
 * The payload currently declares no hooks — the kit's rules are instructions, not
 * runtime enforcement (see the plan's Enforcement Posture). The machinery stays
 * because `tk remove` must know exactly what was added, and MCP server entries are
 * expected to arrive in a later version.
 */

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`cannot parse ${file}: ${err.message}`);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** Back up the target once per install so a bad merge is always recoverable. */
function backup(file, stamp) {
  if (!fs.existsSync(file)) return null;
  const dest = `${file}.tk-backup-${stamp}`;
  fs.copyFileSync(file, dest);
  return dest;
}

/** Union of two hook maps keyed by event, deduped by exact command string. */
function mergeHooks(current = {}, incoming = {}) {
  const result = { ...current };
  for (const [event, entries] of Object.entries(incoming)) {
    const existing = Array.isArray(result[event]) ? result[event] : [];
    const seen = new Set(existing.map((e) => JSON.stringify(e)));
    const added = (entries || []).filter((e) => !seen.has(JSON.stringify(e)));
    result[event] = existing.concat(added);
  }
  return result;
}

/** Union of MCP server maps. An existing server of the same name is left alone. */
function mergeMcpServers(current = {}, incoming = {}) {
  const result = { ...current };
  for (const [name, def] of Object.entries(incoming)) {
    if (!(name in result)) result[name] = def;
  }
  return result;
}

function applyPayload(settingsFile, payloadSettings, stamp) {
  const hasHooks = Boolean(payloadSettings.hooks && Object.keys(payloadSettings.hooks).length);
  const hasServers = Boolean(payloadSettings.mcpServers && Object.keys(payloadSettings.mcpServers).length);

  // Nothing to contribute: leave settings.json alone rather than creating an empty
  // one in a project that never had it.
  if (!hasHooks && !hasServers) {
    return { backupPath: null, installedSettings: { hooks: [], mcpServers: [] } };
  }

  const current = readJson(settingsFile, {});
  const backupPath = backup(settingsFile, stamp);

  const next = { ...current };
  if (hasHooks) next.hooks = mergeHooks(current.hooks, payloadSettings.hooks);
  if (hasServers) next.mcpServers = mergeMcpServers(current.mcpServers, payloadSettings.mcpServers);

  writeJson(settingsFile, next);

  return {
    backupPath,
    installedSettings: {
      hooks: flattenHooks(payloadSettings.hooks),
      mcpServers: Object.keys(payloadSettings.mcpServers || {}),
    },
  };
}

/** Remove exactly what the payload added, leaving everything else intact. */
function revertPayload(settingsFile, payloadSettings) {
  const hasHooks = Boolean(payloadSettings.hooks && Object.keys(payloadSettings.hooks).length);
  const hasServers = Boolean(payloadSettings.mcpServers && Object.keys(payloadSettings.mcpServers).length);
  if (!hasHooks && !hasServers) return { removed: 0 };

  const current = readJson(settingsFile, null);
  if (!current) return { removed: 0 };

  let removed = 0;

  if (current.hooks && payloadSettings.hooks) {
    for (const [event, entries] of Object.entries(payloadSettings.hooks)) {
      if (!Array.isArray(current.hooks[event])) continue;
      const drop = new Set((entries || []).map((e) => JSON.stringify(e)));
      const kept = current.hooks[event].filter((e) => !drop.has(JSON.stringify(e)));
      removed += current.hooks[event].length - kept.length;
      if (kept.length) current.hooks[event] = kept;
      else delete current.hooks[event];
    }
  }

  if (current.mcpServers && payloadSettings.mcpServers) {
    for (const name of Object.keys(payloadSettings.mcpServers)) {
      if (name in current.mcpServers) {
        delete current.mcpServers[name];
        removed += 1;
      }
    }
  }

  writeJson(settingsFile, current);
  return { removed };
}

function flattenHooks(hooks = {}) {
  return Object.entries(hooks).flatMap(([event, entries]) =>
    (entries || []).map((e) => `${event}: ${typeof e === 'string' ? e : JSON.stringify(e)}`)
  );
}

module.exports = { readJson, writeJson, applyPayload, revertPayload };
