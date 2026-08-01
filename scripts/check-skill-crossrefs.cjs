#!/usr/bin/env node
'use strict';

/**
 * Every `/tk:x` reference must resolve to a registered skill. A dangling reference
 * breaks the chain between skills, which is the most common way a multi-skill kit
 * fails in practice: the user runs step one and has no idea what step two is.
 */

const { markdownFiles, read, rel, skillRegistry, report } = require('./lib/payload.cjs');

const REF = /\/tk:([a-z0-9-]+)/g;

function main() {
  const registry = skillRegistry();
  if (!registry.size) return report('skill-crossrefs', ['skill registry is empty']);

  const failures = [];
  const seen = new Set();

  for (const file of markdownFiles()) {
    read(file)
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(REF)) {
          seen.add(m[1]);
          if (!registry.has(m[1])) {
            failures.push(`${rel(file)}:${i + 1} /tk:${m[1]} is not a registered skill`);
          }
        }
      });
  }

  // A registered skill nothing links to is unreachable from the chain.
  for (const name of registry) {
    if (!seen.has(name)) {
      failures.push(`skill "tk:${name}" is referenced by no other file — unreachable from the chain`);
    }
  }

  return report(`skill-crossrefs (${registry.size} skills)`, failures);
}

process.exit(main());
