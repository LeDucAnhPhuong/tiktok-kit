---
name: tk:diagnose
description: Diagnose TikTok performance across paid and organic at once — wasted spend, CPA and ROAS regressions, placement drag, follower stalls, and the cross-plane mismatches neither view shows alone. Every finding cites its metric, value, window, and comparison basis.
user-invocable: true
when_to_use: "Invoke when TikTok performance dropped, spend seems wasted, or a campaign underperforms and the cause is unknown. Not for deciding what to do next — that is /tk:direction."
category: tiktok
keywords: [tiktok, diagnose, chan doan, chẩn đoán, phan tich, phân tích, hieu suat, hiệu suất, roas, cpa, wasted spend, dot tien, đốt tiền, tut, tụt, underperform]
license: MIT
argument-hint: "[campaign | scope]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:diagnose

Finds where paid and organic disagree with each other, or with the previous period.

## Rules That Apply Here

- **No claim without a number** — metric, value, window, comparison basis. All four.
- **`dataTrust` gates conversion findings.** When it is not `trusted`, conversion
  findings are emitted as questions, never conclusions. Use attention proxies
  (6-second view rate, cost per 6-second view) instead.
- **Cross-plane comparisons go through the glossary.** An ad impression is not an
  organic view. Resolve both sides via `skills/_shared/tiktok/metric-glossary.md`.
- Exclude partial periods. Exclude learning-phase windows and say which change caused
  them.
- Scope to top-N. Declare query cost before executing.

## Procedure

### 1. Load context

Read the baseline from `/tk:account`. If absent, run that first — diagnosing without
`dataTrust` produces conclusions that may rest on broken tracking.

### 2. Rule out the cheap explanation first

Run `organic.posting_cadence`. A reach drop that coincides with a posting drop is not
an algorithm problem, and this is the cheapest way to know that before spending
budget on deeper queries.

### 3. Per-plane findings

Ads: spend by campaign, spend versus conversion, placement split, trend against the
previous equal window.

Organic: growth trend, video engagement, completion rates.

Both halves are independent and can run concurrently.

### 4. Cross-plane checks

The actual value of this skill. Load `references/cross-plane-checks.md` and work
through it. A finding that either plane could have produced alone is not a cross-plane
finding.

### 5. Rank

Order findings by money at stake, then by confidence. State the threshold key and its
confidence level behind each one.

## Output

A findings list. Each entry:

```
[finding] <one sentence>
  metric   : <exact name, plane-qualified>
  value    : <number> <unit/currency>
  window   : <dates, partial excluded>
  compared : <basis>
  threshold: <key> (<confidence>)
  trust    : <how dataTrust affects this finding>
```

Plus what could not be checked, and why.

## Language

Read `locale.responseLanguage` from `.claude/.tk.json` — `vi` (default) or `en` — and
write prose in that language. An explicit request in the conversation overrides it for
the rest of the session.

Never translate metric names, numeric values, entity names, threshold keys, or
`dataTrust` values: the user has to be able to match them against TikTok Ads Manager.
Full rules in `rules/tiktok-output-language.md`.

## Workflow Position

**Previous:** `/tk:account`
**Next:** `/tk:creative` — explain why the winners won.
