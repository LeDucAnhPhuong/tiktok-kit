---
name: tk:account
description: Baseline a TikTok account — identity, currency, scale, campaign structure, follower trajectory — and establish whether its conversion data can be trusted by checking pixel event health first. Emits the dataTrust verdict every other tk: skill depends on.
user-invocable: true
when_to_use: "Invoke to get an overview of a TikTok account, check tracking health, or establish a baseline before diagnosis. Not for analyzing why performance changed — that is /tk:diagnose."
category: tiktok
keywords: [tiktok, account, baseline, overview, tong quan, tổng quan, tai khoan, tài khoản, pixel, tracking, health, kenh, kênh]
license: MIT
argument-hint: "[advertiser-id | handle]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:account

Establishes what this account is, and whether its numbers can be believed.

## Rules That Apply Here

- **Tracking health runs before anything conversion-derived.** A CPA computed on a
  broken pixel is indistinguishable from a real one.
- **Never enumerate everything.** Scope structure to top-N by spend.
- State planned query cost before executing; respect `budget.maxQueriesPerRun`.
- Exclude partial periods and say so.

## Procedure

Run in this order. The order is the point.

### 1. Identity

Advertiser profile and account listing: currency, timezone, account status, organic
handle, account age.

Currency comes from the profile, never assumed. Every money figure downstream inherits
it.

### 2. Tracking health — before any conversion claim

Run the `tracking.pixel_health` template. Compare pixel event volume for the last 14
days against the previous 14.

Emit **`dataTrust`**:

| Verdict | Condition |
|---|---|
| `trusted` | pixels present, event volume within the `pixel_event_drop` threshold |
| `conversion-suspect` | volume dropped past threshold, or a pixel reports zero events |
| `untrusted` | pixel capability unavailable or unreadable |

This value is load-bearing. Downstream skills degrade their claims based on it, so
never omit it and never guess it.

### 3. Scale

Spend range, campaign count, follower count, posting cadence. Last 28 days.

### 4. Structure

Objective mix and campaign/ad group counts, scoped to top-N by spend. A full
enumeration burns the budget and adds nothing a scoped view does not.

### 5. Emit the baseline

Write the baseline block per `references/baseline-schema.md`. Downstream skills read
this instead of re-querying.

## Degradation

Missing planes never fail the run. Report what is unavailable and what that costs:

- No ads plane → no spend, structure, or conversion data. `dataTrust` is `untrusted`.
- No organic plane → no follower or content data.
- No pixel capability → `dataTrust` is `untrusted` even if the rest of the ads plane
  works.

## Output

Baseline block plus a plain-language summary of what this account is, and an explicit
statement of the `dataTrust` verdict and its consequence.

## Language

Read `locale.responseLanguage` from `.claude/.tk.json` — `vi` (default) or `en` — and
write prose in that language. An explicit request in the conversation overrides it for
the rest of the session.

Never translate metric names, numeric values, entity names, threshold keys, or
`dataTrust` values: the user has to be able to match them against TikTok Ads Manager.
Full rules in `rules/tiktok-output-language.md`.

## Workflow Position

**Previous:** `/tk:connect`
**Next:** `/tk:diagnose` — find what is actually wrong.
