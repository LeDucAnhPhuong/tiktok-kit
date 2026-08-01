#!/usr/bin/env node
'use strict';

/**
 * Agents are selected by their description, so a description without concrete
 * `<example>` blocks will not reliably fire. This gate also catches a skill or rule
 * naming an agent that does not exist.
 */

const path = require('path');
const { PAYLOAD, SHARED, walk, markdownFiles, read, rel, frontmatter, agentRegistry, report } = require('./lib/payload.cjs');

const AGENT_MENTION = /\b(tiktok-[a-z-]+)\b/g;
const KNOWN_NON_AGENTS = new Set(['tiktok-data-rules', 'tiktok-mcp-routing', 'tiktok-agent-protocol', 'tiktok-research-rules', 'tiktok-kit']);

function main() {
  const failures = [];
  const agentFiles = walk(path.join(PAYLOAD, 'agents')).filter((f) => f.endsWith('.md'));

  if (!agentFiles.length) return report('agent-contract', ['no agent files found']);

  for (const file of agentFiles) {
    const where = rel(file);
    const text = read(file);
    const fm = frontmatter(text);

    if (!fm) {
      failures.push(`${where} frontmatter missing or unclosed`);
      continue;
    }
    for (const key of ['name', 'tools', 'description']) {
      if (!fm[key]) failures.push(`${where} missing "${key}"`);
    }
    const examples = (fm.description || '').match(/<example>/g) || [];
    if (examples.length < 2) {
      failures.push(`${where} description has ${examples.length} <example> block(s), needs at least 2 to route reliably`);
    }
    if (!/## Behavioral Checklist/.test(text)) {
      failures.push(`${where} missing "## Behavioral Checklist"`);
    }
  }

  // Any tiktok-* name mentioned elsewhere must be a real agent.
  //
  // _shared/ is exempt: it is the vendor boundary, and third-party MCP server names
  // (tiktok-ads, tiktok-content) legitimately live there. Everywhere else, a tiktok-*
  // token is meant to be one of this kit's agents.
  const registry = agentRegistry();
  for (const file of markdownFiles()) {
    if (file.includes(`${path.sep}agents${path.sep}`)) continue;
    if (file.startsWith(SHARED)) continue;
    read(file)
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(AGENT_MENTION)) {
          const name = m[1];
          if (KNOWN_NON_AGENTS.has(name) || registry.has(name)) continue;
          failures.push(`${rel(file)}:${i + 1} references unknown agent "${name}"`);
        }
      });
  }

  return report(`agent-contract (${agentFiles.length} agents)`, failures);
}

process.exit(main());
