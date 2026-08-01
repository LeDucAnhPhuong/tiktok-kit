# Kit Contract

Rules for anyone changing this kit. Not shipped to users.

## 1. Deletions Contract (mandatory)

Renaming or removing **any** file under `claude/` requires adding its old relative path
(without the `claude/` prefix) to `claude/metadata.json` `deletions[]`.

Skipping this leaves the old file on every machine that upgrades, and Claude Code loads
both copies. It is the single most common way a kit corrupts an existing install.

Enforced by `scripts/check-metadata-deletions.cjs` when git history is available.

## 2. Vendor Isolation

Vendor names — the MCP providers this kit reads through — may appear **only** under
`claude/skills/_shared/tiktok/`.

Adding, replacing, or removing a vendor should touch two files: `mcp-tool-matrix.md`
and `connection-setup.md`. If a change requires editing a skill or agent, the
abstraction has leaked and the leak is the bug, not the gate.

This is what makes the data source swappable when TikTok publishes an official MCP
endpoint.

Enforced by `scripts/check-vendor-leak.cjs`.

## 3. Threshold Provenance

Every row in `diagnostic-thresholds.md` carries a confidence (`provisional` or
`measured`) and a provenance note of at least ten characters.

Most defaults are uncalibrated. A threshold that looks precise but was never checked
against outcomes drives expensive decisions, so the confidence must stay visible all
the way into `/tk:direction` output.

When you calibrate one against real data, flip it to `measured` and add a row to the
calibration log in the same file.

Enforced by `scripts/check-threshold-provenance.cjs`.

## 4. Query Cost Declaration

Every template in `query-templates.md` needs a cost row, and no documented run may
exceed the default `budget.maxQueriesPerRun`.

Metered vendors bill per query. A workflow the kit cannot afford to run is not a
workflow.

Enforced by `scripts/check-query-budget.cjs`.

## 5. Research Artifacts Must Demand Citations

The research report template must keep its Outside / Inside / Fit sections, its date
and URL fields, the official/reported/speculative labels, and the announced-vs-available
distinction. The research rules file must keep the live-lookup rule, the three-source
minimum, staleness windows, and the cite-URLs rule.

Runtime behavior cannot be enforced — the model may still answer from memory. What can
be enforced is that the artifacts never *permit* it. If the template stops asking,
nothing downstream will.

Enforced by `scripts/check-research-citations.cjs`.

## 6. Skill Frontmatter

Every `SKILL.md` needs `name` (with `tk:` prefix), `description`, `user-invocable: true`,
and `when_to_use`.

Descriptions: 50-512 characters, must contain "TikTok", must not open with "Use this".
`when_to_use` must carry a negative clause ("Not for …") — over-triggering on unrelated
requests is as damaging as never triggering.

Enforced by `scripts/check-skill-frontmatter.cjs`.

## 7. Agent Contract

Every agent needs `name`, `tools`, a `description` with **at least two** `<example>`
blocks, and a `## Behavioral Checklist`.

Agents are selected by their description. Without concrete examples, delegation does
not reliably fire.

Exactly one agent — `tiktok-growth-strategist` — may recommend. Do not add prescriptive
language to the others.

Enforced by `scripts/check-agent-contract.cjs`.

## 8. Chain Integrity

Every `/tk:` reference must resolve to a registered skill, and every registered skill
must be referenced somewhere. An unreferenced skill is unreachable from the chain, and
the chain is how users get past step one.

Enforced by `scripts/check-skill-crossrefs.cjs`.

## 9. Manifest Freshness

Run `npm run manifest` after any payload change. A stale manifest asserts integrity it
cannot back.

Enforced by `scripts/check-manifest-fresh.cjs`.

## Enforcement Posture

Two layers ship: **instructions** (markdown rules, restated in each skill and agent
body because a rules file may not be loaded) and **static gates** (the nine CI scripts
above, which check the kit's source, never its runtime behavior).

A third layer — runtime hooks counting MCP calls or blocking uncited reports — was
scoped and deliberately declined. Consequences accepted: query budget can be exceeded,
research can be answered from memory, conversion claims can slip past a failing
`dataTrust`, and the descriptive/prescriptive split holds by convention only.

Because enforcement is out, the instruction layer carries the full load. That raises the
bar on wording: rules must be specific and restated where they apply.

Revisit if real usage shows a rule being violated repeatedly.

## Adding A Gate

Standalone CJS script, exit 1 on failure, human-readable output naming file and line.
Register it in `scripts/check-all.cjs`. No shared framework at this size.

**Write the failing fixture first.** A gate never exercised against a failure is not a
gate.
