# TikTok MCP Routing

Decision table from user intent to capability. Capabilities resolve to concrete tools
through `skills/_shared/tiktok/mcp-tool-matrix.md`.

Skills and agents route through this file so they stay short and so vendor changes
touch exactly one place.

## Intent → Capability

| User is asking | Capability needed | Plane |
|---|---|---|
| "is my account connected", "why can't you see my data" | list linked sources, list accounts | any |
| "how is my account doing overall" | account overview, advertiser profile | ads + organic |
| "is my tracking working", "are conversions real" | pixel inventory, pixel event volume | ads |
| "where is my money going" | campaign inventory, spend by campaign | ads |
| "what is wasting spend" | spend without conversion | ads |
| "which audience responds" | audience breakdown, custom audiences | ads |
| "what targeting is set" | ad group targeting and bid | ads |
| "is my channel growing" | organic growth trend | organic |
| "which videos work" | video engagement | organic |
| "am I posting enough" | posting cadence | organic |
| "what's trending", "what are competitors doing" | search on-platform content, video metadata | external |
| "why did this video work" | video metadata, transcript, plus multimodal analysis | external |

## Degradation Rules

A missing plane never fails the run silently.

1. Look up the capability in the matrix.
2. If the preferred tool is unavailable, use the fallback.
3. If no fallback exists, **state the gap in the output** and continue with what is
   reachable.
4. Never infer a number that could not be fetched. An absent metric is absent.

Specific consequences worth naming:

- No pixel capability → `dataTrust` is `untrusted`, and no conversion claim may be made.
- No field-discovery capability → stop rather than guessing field names.
- No external plane → research Outside half degrades to web-only and must say so.

## Cost Awareness

Every capability call costs budget on metered vendors. Before a multi-step routine,
sum the planned cost from `skills/_shared/tiktok/query-templates.md` and compare
against `budget.maxQueriesPerRun`. Narrow the scope rather than overrunning.
