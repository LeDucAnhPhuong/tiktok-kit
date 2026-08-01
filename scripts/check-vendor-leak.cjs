#!/usr/bin/env node
'use strict';

/**
 * Vendor names may appear only under claude/skills/_shared/tiktok/. That confinement is
 * what makes the data source swappable: adding or replacing a vendor should touch the
 * tool matrix and the setup guide, nothing else. A vendor name anywhere else means the
 * abstraction leaked, and the leak is the bug.
 */

const { markdownFiles, read, rel, report, SHARED } = require('./lib/payload.cjs');

const VENDORS = /\b(detrics|adsmcp|ysntony|seym0n|tikneuron)\b/i;

function main() {
  const failures = [];

  for (const file of markdownFiles()) {
    if (file.startsWith(SHARED)) continue;
    read(file)
      .split('\n')
      .forEach((line, i) => {
        const m = VENDORS.exec(line);
        if (m) failures.push(`${rel(file)}:${i + 1} vendor "${m[0]}" outside _shared/tiktok/`);
      });
  }

  return report('vendor-leak', failures);
}

process.exit(main());
