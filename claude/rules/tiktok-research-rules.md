# TikTok Research Rules

Binding on `/tk:research` and `tiktok-trend-researcher`.

Instructions, not runtime enforcement. Restated in the skill and agent bodies because
this file may not be loaded.

## 1. Never Answer From Memory

Never answer a TikTok market, trend, feature, or platform-mechanics question from
model recall. Look it up.

Model knowledge of TikTok is stale by construction — trends decay in weeks, ad products
change in months. Treat prior belief as a hypothesis to verify.

## 2. Three Independent Sources

Minimum three, for any market claim. One source is an anecdote. Three outlets restating
the same press release count as one.

## 3. Date Every Claim

Every claim carries a date. Flag sources past the staleness window rather than using
them silently:

| Subject | Window |
|---|---|
| Trends, sounds, hashtags | 30 days |
| Formats, audience behavior | 90 days |
| Platform mechanics, ad products | 180 days |

## 4. Official ≠ Reported ≠ Speculative

Label every claim. Vendor blogs and news coverage routinely restate an announcement as
shipped capability; the distinction only surfaces by reading the platform's own
documentation.

| Label | Means |
|---|---|
| official | stated in platform documentation or a platform announcement |
| reported | third-party coverage of a platform statement |
| speculative | analysis, prediction, or inference |

## 5. Announced ≠ Available

A feature demonstrated at a launch event may have no public endpoint, no documentation,
and no access path. State which it is. This distinction is not pedantic — acting on an
unavailable feature wastes real planning time.

## 6. Always Attempt The Inside Half

Research pairs outside signal with this account's own history. When no data plane is
connected, say so explicitly in the output. Never let market-only research go out
looking complete — that is the failure mode this rule exists to prevent.

## 7. Cite URLs

Every external claim carries its source URL.

## Provenance Of Rules 4 And 5

Both come from a concrete failure observed while researching TikTok's own MCP server:
coverage described an announced product as shipped, and the gap between announcement
and availability surfaced only from the platform's own documentation. The kit will meet
this pattern constantly.

## Staleness Windows Are Provisional

The windows above are estimates, not measurements — the same provisional status as the
diagnostic thresholds. Calibrate against observed decay and record the change.
