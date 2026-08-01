#!/usr/bin/env node
'use strict';

/**
 * The manifest is what makes an install reproducible and a partial payload detectable.
 * A stale manifest is worse than none — it asserts integrity it cannot back.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ROOT, PAYLOAD, walk, report } = require('./lib/payload.cjs');

const MANIFEST = path.join(ROOT, 'release-manifest.json');

function main() {
  if (!fs.existsSync(MANIFEST)) {
    return report('manifest-fresh', ['release-manifest.json missing — run `npm run manifest`']);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const recorded = new Map((manifest.files || []).map((f) => [f.path, f.checksum]));
  const failures = [];

  const actual = new Map();
  for (const full of walk(PAYLOAD)) {
    const key = path.relative(PAYLOAD, full).split(path.sep).join('/');
    actual.set(key, crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex'));
  }

  for (const [file, sum] of actual) {
    if (!recorded.has(file)) failures.push(`${file} is not in the manifest`);
    else if (recorded.get(file) !== sum) failures.push(`${file} checksum differs from the manifest`);
  }
  for (const file of recorded.keys()) {
    if (!actual.has(file)) failures.push(`${file} is in the manifest but missing from the payload`);
  }

  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  if (manifest.version !== version) {
    failures.push(`manifest version ${manifest.version} does not match package version ${version}`);
  }

  if (failures.length) failures.push('run `npm run manifest` to refresh');
  return report(`manifest-fresh (${actual.size} files)`, failures);
}

process.exit(main());
