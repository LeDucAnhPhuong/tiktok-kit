# TikTok Data Rules

Binding on every `tk:*` skill and every `tiktok-*` agent.

These are **instructions, not runtime enforcement**. Nothing blocks a violation at
execution time. That is a deliberate trade-off, and it means each rule below is
restated in the body of the skill or agent it governs — do not rely on this file
having been loaded.

## 1. No Claim Without A Number

Every conclusion names the metric, its value, the time window, and what it is being
compared against. A statement that cannot cite those four things is an opinion and
must be labeled as one.

## 2. Tracking Health Gates Conversion Claims

`dataTrust` is established before any conversion-derived statement:

| Value | Meaning | Effect |
|---|---|---|
| `trusted` | pixels present, event volume stable | conversion claims allowed |
| `conversion-suspect` | event volume dropped past threshold, or a pixel reports zero | conversion findings become questions, never conclusions. Use attention proxies |
| `untrusted` | pixel state unknown or unreadable | no conversion claims at all |

A CPA computed on a broken pixel looks exactly like a real CPA. This rule is the only
thing separating them.

## 3. Cross-Plane Comparison Requires The Glossary

Ads and organic do not share metric definitions. Before comparing anything across
planes, resolve both sides through `skills/_shared/tiktok/metric-glossary.md`. An
ad impression is not an organic view, and ads CTR is not organic engagement rate.

## 4. Respect The Query Budget

Read `budget.maxQueriesPerRun` from `.tk.json`. State the planned cost before
executing. On exhaustion, stop and report what was not covered — never silently
truncate, because a truncated result reads identically to a complete one.

Never enumerate all campaigns, all ad groups, or all videos. Scope to top-N.

## 5. One Change Per Day

Never recommend more than one budget or audience change per day for the same entity.
Frequent edits reset the learning phase and degrade delivery — the recommendation
itself becomes the cause of the next problem.

## 6. Read-Only

This kit never writes to TikTok. No campaign creation, no status changes, no budget
edits, no creative uploads. Recommendations are advisory; the user executes them.

## 7. Credentials Are Never Stored Here

`.tk.json` records connection *state*, never tokens or keys. Credentials belong in the
MCP client config or on the vendor platform. Never write a token into any kit file,
report, or log.

## 8. Disclose Who Holds The Token

Hosted MCP vendors hold the user's TikTok OAuth token. When recommending or
discussing a hosted vendor, say so before the user authorizes — not after.

## 9. Partial Periods Are Excluded

A running day or week always looks worse than a completed one. Exclude partial periods
from every comparison, and say that they were excluded.

## 10. Learning Phase Suppresses Judgment

Data drawn from within `learning_phase_days` of a known budget or audience change is
not evidence. Name the change, exclude the window.

## Routing

When the user asks about the TikTok market, competitors, trends, hashtags, sounds, or
what other accounts are doing, route to `/tk:research` rather than answering directly.
Model memory of TikTok is stale by construction.
