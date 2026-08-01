# Metric Glossary

Ads and organic name related ideas differently, and TikTok's view definitions are not
interchangeable. Comparing across planes without this mapping produces numbers that
look meaningful and are not.

Read this before any cross-plane statement.

## The View Problem

TikTok counts several distinct things that all get called "views" in casual use:

| Term | What it counts | Where it appears |
|---|---|---|
| Impression | ad served | ads |
| 2-second view | viewer stayed 2 seconds | ads |
| 6-second view | viewer stayed 6 seconds | ads |
| Complete view | video watched to the end | ads |
| Video view | organic playback, counted on start | organic |

**A naive "views" comparison between an ad and an organic post is meaningless.** An
organic video view counts at playback start; an ad 6-second view counts after six
seconds of retention. The organic number will always look larger.

Comparable pairs, when a comparison is genuinely needed:

| Ads side | Organic side | Caveat |
|---|---|---|
| impressions | video views | Both are top-of-funnel exposure; neither implies attention |
| 6-second view rate | average watch time / duration | Directionally comparable, not equal |
| complete view rate | completion rate | Closest true pair — prefer this one |

## Engagement

| Ads | Organic | Notes |
|---|---|---|
| CTR (clicks ÷ impressions) | engagement rate (interactions ÷ views) | **Not the same denominator or numerator.** Never present one as the other |
| — | likes, comments, shares, bookmarks | Shares and bookmarks signal intent more strongly than likes |
| conversions | — | Organic has no conversion event unless a pixel fires from profile traffic |

## Money

| Metric | Definition | Trap |
|---|---|---|
| Spend | amount billed in the account currency | Always check `advertiser_info` for currency; do not assume USD |
| CPC | spend ÷ clicks | |
| CPM | spend ÷ impressions × 1000 | |
| CPA | spend ÷ conversions | **Depends on pixel health.** Invalid when `dataTrust` is not `trusted` |
| ROAS | revenue ÷ spend | Same pixel dependency, plus attribution-window dependency |
| Cost per 6-second view | spend ÷ 6-second views | Useful attention proxy when conversion data is untrusted |

## Attribution

TikTok attributes on click-through and view-through windows configured per account.
Two consequences that change how numbers must be read:

- **Window length is not universal.** A 7-day click window and a 1-day view window
  produce different conversion counts for identical delivery. Report the window
  alongside any conversion figure.
- **Organic-assisted conversions are largely invisible.** Organic content that drove a
  later paid conversion is credited to paid. Cross-plane analysis must state this
  rather than concluding organic contributes nothing.

## Time Windows

Every reported number carries its window. Comparisons must use equal windows, and
partial current periods are excluded — a running day or week always looks worse and
has caused more false alarms than any real regression.

Standard windows for this kit: last 7 days, last 28 days, previous equal period for
comparison.

## Learning Phase

After a meaningful budget or audience change, delivery re-enters a learning phase and
performance is unrepresentative until it exits. Numbers drawn from a learning window
are not evidence. When a change date is known, say so and exclude the window.

## Naming Discipline

When writing a finding:

- Name the exact metric, not the casual term. "6-second view rate", not "watch rate".
- State the plane. "organic completion rate", not "completion rate".
- State the window and whether it excludes a partial period.
- State the currency for any money figure.
