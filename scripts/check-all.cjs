#!/usr/bin/env node
'use strict';

/** Run every gate, report the whole picture, exit non-zero if any failed. */

const { execFileSync } = require('child_process');
const path = require('path');

const GATES = [
  'check-skill-frontmatter.cjs',
  'check-skill-crossrefs.cjs',
  'check-agent-contract.cjs',
  'check-vendor-leak.cjs',
  'check-threshold-provenance.cjs',
  'check-query-budget.cjs',
  'check-research-citations.cjs',
  'check-language-contract.cjs',
  'check-metadata-deletions.cjs',
  'check-manifest-fresh.cjs',
];

function main() {
  console.log('tiktok-kit quality gates\n');
  let failed = 0;

  for (const gate of GATES) {
    try {
      const out = execFileSync(process.execPath, [path.join(__dirname, gate)], { encoding: 'utf8' });
      process.stdout.write(out);
    } catch (err) {
      if (err.stdout) process.stdout.write(err.stdout);
      if (err.stderr) process.stderr.write(err.stderr);
      failed += 1;
    }
  }

  console.log(`\n${failed ? `${failed} gate(s) failed` : `all ${GATES.length} gates passed`}`);
  return failed ? 1 : 0;
}

process.exit(main());
