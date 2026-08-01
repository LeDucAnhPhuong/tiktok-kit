#!/usr/bin/env node
'use strict';

/**
 * Frontmatter is this kit's only routing signal. Enforcement of behavior is out of
 * scope by design, so a skill that cannot be discovered is a skill that does not exist.
 */

const path = require('path');
const { PAYLOAD, walk, read, rel, frontmatter, report } = require('./lib/payload.cjs');

const REQUIRED = ['name', 'description', 'user-invocable', 'when_to_use'];
const MIN_DESC = 50;
const MAX_DESC = 512;

function main() {
  const failures = [];
  const files = walk(path.join(PAYLOAD, 'skills')).filter((f) => path.basename(f) === 'SKILL.md');

  if (!files.length) return report('skill-frontmatter', ['no SKILL.md files found']);

  for (const file of files) {
    const where = rel(file);
    const fm = frontmatter(read(file));

    if (!fm) {
      failures.push(`${where} frontmatter missing or unclosed`);
      continue;
    }

    for (const key of REQUIRED) {
      if (!fm[key]) failures.push(`${where} missing "${key}"`);
    }

    if (fm.name && !fm.name.startsWith('tk:')) {
      failures.push(`${where} name "${fm.name}" must use the tk: prefix`);
    }

    if (fm['user-invocable'] && fm['user-invocable'] !== 'true') {
      failures.push(`${where} user-invocable must be true (got "${fm['user-invocable']}")`);
    }

    if (fm.description) {
      const d = fm.description;
      if (d.length < MIN_DESC) failures.push(`${where} description ${d.length} chars, minimum ${MIN_DESC}`);
      if (d.length > MAX_DESC) failures.push(`${where} description ${d.length} chars, maximum ${MAX_DESC}`);
      if (/^use this\b/i.test(d)) {
        failures.push(`${where} description starts with "Use this" — lead with the capability instead`);
      }
      if (!/tiktok/i.test(d)) {
        failures.push(`${where} description must contain "TikTok" so it routes on-domain and not off-domain`);
      }
    }

    if (fm.when_to_use && !/\bnot for\b/i.test(fm.when_to_use)) {
      failures.push(`${where} when_to_use needs a negative clause ("Not for ...") to stop over-triggering`);
    }
  }

  return report(`skill-frontmatter (${files.length} skills)`, failures);
}

process.exit(main());
