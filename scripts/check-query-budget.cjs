#!/usr/bin/env node
'use strict';

/**
 * Metered vendors bill per query and a free tier is small. Every documented template
 * must carry a cost, and the default budget must cover the documented runs — otherwise
 * the kit ships a workflow it cannot afford to execute.
 */

const path = require('path');
const fs = require('fs');
const { PAYLOAD, rel, report } = require('./lib/payload.cjs');
const { DEFAULT_CONFIG } = require('../lib/tk-config.js');

const FILE = path.join(PAYLOAD, 'skills', '_shared', 'tiktok', 'query-templates.md');

function main() {
  if (!fs.existsSync(FILE)) return report('query-budget', [`${rel(FILE)} missing`]);

  const text = fs.readFileSync(FILE, 'utf8');
  const failures = [];

  // Template sections: "## `name.thing`"
  const sections = [...text.matchAll(/^## `([a-z0-9_.]+)`/gm)].map((m) => m[1]);
  // Cost rows: "| `name.thing` | 2 |"
  const costs = new Map();
  for (const m of text.matchAll(/^\|\s*`([a-z0-9_.]+)`\s*\|\s*([0-9]+)[^|]*\|/gm)) {
    costs.set(m[1], Number(m[2]));
  }

  if (!sections.length) failures.push(`${rel(FILE)} declares no templates`);

  for (const name of sections) {
    if (!costs.has(name)) failures.push(`${rel(FILE)} template "${name}" has no cost row`);
  }
  for (const name of costs.keys()) {
    if (!sections.includes(name)) failures.push(`${rel(FILE)} cost row "${name}" has no template section`);
  }

  const budget = DEFAULT_CONFIG.budget.maxQueriesPerRun;
  const maxSingle = Math.max(0, ...costs.values());
  if (maxSingle > budget) {
    failures.push(`a single template costs ${maxSingle}, above the default budget of ${budget}`);
  }

  // Documented run totals must fit the default budget.
  for (const m of text.matchAll(/A (?:full|scoped) `?\/tk:([a-z-]+)`? run costs about (\d+)/g)) {
    const [, skill, cost] = m;
    if (Number(cost) > budget) {
      failures.push(`/tk:${skill} documented at ${cost} queries, above the default budget of ${budget}`);
    }
  }

  return report(`query-budget (${sections.length} templates, budget ${budget})`, failures);
}

process.exit(main());
