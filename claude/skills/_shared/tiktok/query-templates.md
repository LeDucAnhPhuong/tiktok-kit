# Query Templates

Named recipes for the generic query capability. Each declares its intent, what it
needs, and its **cost in queries** — metered vendors bill per query and a small free
tier is exhausted in one careless run.

Field names are never hardcoded. Resolve them through the field-discovery capability
first (`mcp-tool-matrix.md` → "Discover available fields"). Vendors rename fields; a
hardcoded name fails silently as a missing column rather than loudly as an error.

## Cost Accounting

One template execution = the cost listed. A skill sums the templates it intends to
run, compares against `budget.maxQueriesPerRun` in `.tk.json`, and states the total
before executing. When the budget cannot cover the plan, narrow the scope — never
silently truncate results.

| Template | Cost |
|---|---|
| `fields.discover` | 1 per plane, cacheable for the session |
| `account.overview` | 1 |
| `ads.spend_by_campaign` | 1 |
| `ads.spend_vs_conversion` | 1 |
| `ads.placement_split` | 1 |
| `ads.audience_breakdown` | 1 |
| `ads.trend_by_period` | 2 (current + previous window) |
| `organic.growth_trend` | 1 |
| `organic.video_engagement` | 1 |
| `organic.posting_cadence` | 1 |
| `tracking.pixel_health` | 2 |

A full `/tk:account` run costs about 5. A scoped `/tk:diagnose` costs about 7. The
default budget of 12 covers one of each, not both plus research.

---

## `fields.discover`

**Intent:** learn which metrics and dimensions this connection actually exposes.
**Run:** once per plane per session, before any other template.
**Output:** field list, cached for the rest of the run.

Never skip this to save a query. Guessing a field name is how a run produces a
confident empty table.

## `account.overview`

**Intent:** identity and scale in one shot.
**Dimensions:** account.
**Metrics:** spend, impressions, conversions (ads); followers, video views (organic).
**Window:** last 28 days.
**Notes:** read currency and timezone from the advertiser profile capability, not
from this query.

## `ads.spend_by_campaign`

**Intent:** where the money went.
**Dimensions:** campaign.
**Metrics:** spend, impressions, clicks, conversions.
**Window:** last 28 days, excluding any partial current day.
**Scope:** top N by spend, N from the caller. Never request all campaigns.

## `ads.spend_vs_conversion`

**Intent:** find spend that bought nothing.
**Dimensions:** ad group.
**Metrics:** spend, conversions, CPA.
**Window:** last 28 days.
**Filter:** conversions = 0 and spend above the `wasted_spend_floor` threshold.
**Notes:** prefer the dedicated wasted-spend capability when available; this template
is the fallback and costs the same but returns less context.

## `ads.placement_split`

**Intent:** whether one placement is dragging the average.
**Dimensions:** placement.
**Metrics:** spend, impressions, 6-second views, conversions.
**Window:** last 28 days.

## `ads.audience_breakdown`

**Intent:** which segments respond.
**Dimensions:** age, gender, region.
**Metrics:** spend, impressions, clicks, conversions.
**Window:** last 28 days.
**Notes:** segments below the `min_segment_impressions` threshold are noise. Drop
them rather than reporting a CPA computed on twelve impressions.

## `ads.trend_by_period`

**Intent:** direction of travel, not a snapshot.
**Dimensions:** campaign, period.
**Metrics:** spend, CPA, ROAS.
**Windows:** last 28 days and the previous 28 days.
**Notes:** equal windows, both excluding partial periods. Exclude any window
overlapping a known learning phase.

## `organic.growth_trend`

**Intent:** is the channel actually growing.
**Dimensions:** date.
**Metrics:** followers, video views, engagement.
**Window:** last 28 days, daily.

## `organic.video_engagement`

**Intent:** which content holds attention.
**Dimensions:** video.
**Metrics:** views, completion rate, likes, comments, shares, bookmarks, duration.
**Window:** last 28 days.
**Scope:** top N and bottom N by views, N from the caller.
**Notes:** shares and bookmarks weigh more than likes as intent signals. Duration is
required — completion rate is not comparable across very different lengths.

## `organic.posting_cadence`

**Intent:** whether output volume explains a reach change.
**Dimensions:** date.
**Metrics:** post count, total views.
**Window:** last 56 days, weekly.
**Notes:** a reach drop that coincides with a posting drop is not an algorithm
problem, and this is the cheapest way to rule that out first.

## `tracking.pixel_health`

**Intent:** decide whether conversion data can be trusted at all.
**Step 1:** pixel inventory.
**Step 2:** event volume per pixel, last 14 days versus the previous 14.
**Output:** feeds `dataTrust`. A drop past the `pixel_event_drop` threshold, or a
pixel with zero events, means conversion figures are suspect.

**Run this before any conversion-based conclusion.** Every downstream conversion claim
inherits its verdict.
