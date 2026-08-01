#!/usr/bin/env node
'use strict';

/**
 * A payload file that was renamed or removed must be listed in metadata.json
 * `deletions[]`, or every machine that upgrades keeps the old copy and Claude Code
 * loads both. This is the single most common way a kit corrupts an existing install.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT, PAYLOAD, rel, report } = require('./lib/payload.cjs');

const METADATA = path.join(PAYLOAD, 'metadata.json');

function gitStatus() {
  try {
    execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'ignore' });
  } catch {
    return null; // not a git repo — nothing to compare against
  }
  try {
    const payloadRel = path.relative(ROOT, PAYLOAD).split(path.sep).join('/') || 'claude';
    return execSync(`git diff --name-status HEAD -- ${payloadRel}`, { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return null; // no HEAD yet
  }
}

function main() {
  if (!fs.existsSync(METADATA)) return report('metadata-deletions', [`${rel(METADATA)} missing`]);

  const metadata = JSON.parse(fs.readFileSync(METADATA, 'utf8'));
  if (!Array.isArray(metadata.deletions)) {
    return report('metadata-deletions', [`${rel(METADATA)} has no deletions[] array`]);
  }

  const status = gitStatus();
  if (status === null) {
    console.log('  skip metadata-deletions (no git history to compare against)');
    return 0;
  }

  const declared = new Set(metadata.deletions);
  const failures = [];

  for (const line of status.split('\n').filter(Boolean)) {
    const [code, ...paths] = line.split('\t');
    const isDelete = code.startsWith('D');
    const isRename = code.startsWith('R');
    if (!isDelete && !isRename) continue;

    // For a rename, git reports the old path first.
    const oldPath = paths[0];
    const key = oldPath.replace(/^claude\//, '');
    if (!declared.has(key)) {
      failures.push(`${oldPath} was ${isRename ? 'renamed' : 'deleted'} but is not in metadata.json deletions[]`);
    }
  }

  return report(`metadata-deletions (${declared.size} declared)`, failures);
}

process.exit(main());
