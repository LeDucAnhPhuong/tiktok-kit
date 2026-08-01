'use strict';

/** Shared helpers for the gate scripts. Nine small gates, one tiny helper — no framework. */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PAYLOAD = path.join(ROOT, 'claude');
const SHARED = path.join(PAYLOAD, 'skills', '_shared');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const rel = (full) => path.relative(ROOT, full).split(path.sep).join('/');
const read = (full) => fs.readFileSync(full, 'utf8');

function markdownFiles() {
  return walk(PAYLOAD).filter((f) => f.endsWith('.md'));
}

/** Parse the leading `---` frontmatter block. Returns null when absent or unclosed. */
function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = text.slice(4, end);
  const out = {};
  for (const line of block.split('\n')) {
    const m = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

/** Registered skill names, normalized without the `tk:` prefix. */
function skillRegistry() {
  const names = new Set();
  for (const file of walk(path.join(PAYLOAD, 'skills'))) {
    if (path.basename(file) !== 'SKILL.md') continue;
    const fm = frontmatter(read(file));
    if (fm && fm.name) names.add(fm.name.replace(/^tk:/, ''));
  }
  return names;
}

function agentRegistry() {
  const names = new Set();
  for (const file of walk(path.join(PAYLOAD, 'agents'))) {
    if (!file.endsWith('.md')) continue;
    const fm = frontmatter(read(file));
    if (fm && fm.name) names.add(fm.name);
  }
  return names;
}

/** Standard gate reporter: prints failures with file:line and returns an exit code. */
function report(name, failures) {
  if (!failures.length) {
    console.log(`  ok   ${name}`);
    return 0;
  }
  console.log(`  FAIL ${name}`);
  for (const f of failures) console.log(`       ${f}`);
  return 1;
}

module.exports = {
  ROOT,
  PAYLOAD,
  SHARED,
  walk,
  rel,
  read,
  markdownFiles,
  frontmatter,
  skillRegistry,
  agentRegistry,
  report,
};
