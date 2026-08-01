#!/usr/bin/env node
'use strict';

/**
 * Every diagnostic threshold must state its confidence and where it came from. A
 * threshold that looks precise but was never calibrated invites expensive decisions;
 * the provenance column is what keeps that visible in downstream output.
 */

const path = require('path');
const fs = require('fs');
const { PAYLOAD, rel, report } = require('./lib/payload.cjs');

const FILE = path.join(PAYLOAD, 'skills', '_shared', 'tiktok', 'diagnostic-thresholds.md');
const CONFIDENCE = /\b(provisional|measured)\b/;

function main() {
  if (!fs.existsSync(FILE)) {
    return report('threshold-provenance', [`${rel(FILE)} missing`]);
  }

  const failures = [];
  const lines = fs.readFileSync(FILE, 'utf8').split('\n');
  let rows = 0;

  lines.forEach((line, i) => {
    // Threshold rows start with a backticked key cell.
    if (!/^\|\s*`[a-z0-9_]+`\s*\|/.test(line)) return;
    rows += 1;
    const cells = line.split('|').map((c) => c.trim());
    const key = cells[1];
    if (cells.length < 8) {
      failures.push(`${rel(FILE)}:${i + 1} ${key} has ${cells.length - 2} cells, expected 6`);
      return;
    }
    if (!CONFIDENCE.test(line)) {
      failures.push(`${rel(FILE)}:${i + 1} ${key} missing confidence (provisional|measured)`);
    }
    const provenance = cells[cells.length - 2];
    if (!provenance || provenance.length < 10) {
      failures.push(`${rel(FILE)}:${i + 1} ${key} provenance too thin: "${provenance}"`);
    }
  });

  if (rows === 0) failures.push(`${rel(FILE)} contains no threshold rows`);

  return report(`threshold-provenance (${rows} rows)`, failures);
}

process.exit(main());
