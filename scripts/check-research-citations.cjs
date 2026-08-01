#!/usr/bin/env node
'use strict';

/**
 * Research correctness cannot be enforced at runtime — the model may still answer from
 * memory. What CAN be enforced is that the artifacts never permit it: the report
 * template must demand dates, sources, and the official/reported/speculative label, and
 * the rules file must carry the live-lookup rule. If the template stops asking, nothing
 * downstream will.
 */

const path = require('path');
const fs = require('fs');
const { PAYLOAD, rel, report } = require('./lib/payload.cjs');

const TEMPLATE = path.join(PAYLOAD, 'skills', 'tk-research', 'templates', 'research-report.md');
const RULES = path.join(PAYLOAD, 'rules', 'tiktok-research-rules.md');
const CREDIBILITY = path.join(PAYLOAD, 'skills', 'tk-research', 'references', 'source-credibility.md');

const TEMPLATE_MUST_HAVE = [
  [/## Outside/i, 'an "Outside" section'],
  [/## Inside/i, 'an "Inside" section'],
  [/## Fit/i, 'a "Fit" section'],
  [/## Sources/i, 'a "Sources" section'],
  [/\bdate\b/i, 'a date field'],
  [/official.*reported.*speculative/is, 'the official/reported/speculative labels'],
  [/available.*announced/is, 'the available vs announced distinction'],
  [/url/i, 'a URL field'],
];

const RULES_MUST_HAVE = [
  [/never answer .*(from )?(model )?(memory|recall)/i, 'the never-answer-from-memory rule'],
  [/three independent sources/i, 'the three-source minimum'],
  [/staleness|stale/i, 'staleness windows'],
  [/announced/i, 'the announced-vs-available rule'],
  [/cite urls?/i, 'the cite-URLs rule'],
];

function checkFile(file, requirements, failures) {
  if (!fs.existsSync(file)) {
    failures.push(`${rel(file)} missing`);
    return;
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const [pattern, label] of requirements) {
    if (!pattern.test(text)) failures.push(`${rel(file)} must require ${label}`);
  }
}

function main() {
  const failures = [];
  checkFile(TEMPLATE, TEMPLATE_MUST_HAVE, failures);
  checkFile(RULES, RULES_MUST_HAVE, failures);

  if (!fs.existsSync(CREDIBILITY)) {
    failures.push(`${rel(CREDIBILITY)} missing — source tiers are undefined`);
  }

  return report('research-citations', failures);
}

process.exit(main());
