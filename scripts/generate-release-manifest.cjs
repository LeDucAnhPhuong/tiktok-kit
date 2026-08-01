#!/usr/bin/env node
'use strict';

/**
 * Emit a checksum manifest of the payload so an install is reproducible and a
 * tampered or partially-written payload is detectable.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAYLOAD = path.join(ROOT, 'claude');
const OUT = path.join(ROOT, 'release-manifest.json');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function main() {
  if (!fs.existsSync(PAYLOAD)) {
    console.error(`generate-release-manifest: payload not found at ${PAYLOAD}`);
    return 1;
  }

  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const files = walk(PAYLOAD)
    .map((full) => {
      const buf = fs.readFileSync(full);
      return {
        path: path.relative(PAYLOAD, full).split(path.sep).join('/'),
        checksum: crypto.createHash('sha256').update(buf).digest('hex'),
        size: buf.length,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  fs.writeFileSync(OUT, `${JSON.stringify({ version, files }, null, 2)}\n`, 'utf8');
  console.log(`generate-release-manifest: ${files.length} file(s) → ${path.relative(ROOT, OUT)}`);
  return 0;
}

process.exit(main());
