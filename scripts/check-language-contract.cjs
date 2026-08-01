#!/usr/bin/env node
'use strict';

/**
 * Output language is instruction-only, and a rules file may not be loaded when a skill
 * runs. So every skill and agent must restate it in its own body — that restatement is
 * the only thing that actually reaches the model.
 */

const path = require('path');
const fs = require('fs');
const { PAYLOAD, walk, read, rel, report } = require('./lib/payload.cjs');

const RULE = path.join(PAYLOAD, 'rules', 'tiktok-output-language.md');

function main() {
  const failures = [];

  if (!fs.existsSync(RULE)) return report('language-contract', [`${rel(RULE)} missing`]);

  const ruleText = read(RULE);
  for (const [pattern, label] of [
    [/locale\.responseLanguage/, 'the config key'],
    [/never translate|Never Translated/i, 'the do-not-translate list'],
    [/metric names?/i, 'metric names as untranslatable'],
  ]) {
    if (!pattern.test(ruleText)) failures.push(`${rel(RULE)} must document ${label}`);
  }

  const targets = [
    ...walk(path.join(PAYLOAD, 'skills')).filter((f) => path.basename(f) === 'SKILL.md'),
    ...walk(path.join(PAYLOAD, 'agents')).filter((f) => f.endsWith('.md')),
  ];

  for (const file of targets) {
    const text = read(file);
    if (!/## Language/.test(text)) {
      failures.push(`${rel(file)} has no "## Language" section — the rule will not reach the model`);
      continue;
    }
    if (!/locale\.responseLanguage/.test(text)) {
      failures.push(`${rel(file)} Language section does not name locale.responseLanguage`);
    }
    if (!/tiktok-output-language\.md/.test(text)) {
      failures.push(`${rel(file)} Language section does not link the full rule`);
    }
  }

  return report(`language-contract (${targets.length} files)`, failures);
}

process.exit(main());
