---
name: tk:direction
description: Turn TikTok diagnosis and creative patterns into a prioritized growth direction — where the account stands, at most five ranked moves with kill criteria, and what to stop doing. Every recommendation cites a number, and threshold confidence is shown rather than hidden.
user-invocable: true
when_to_use: "Invoke to decide what to do next with a TikTok account after diagnosis. Not for gathering the data itself — run /tk:account and /tk:diagnose first."
category: tiktok
keywords: [tiktok, direction, dinh huong, định hướng, chien luoc, chiến lược, nen lam gi, nên làm gì, uu tien, ưu tiên, ke hoach, kế hoạch, strategy, next steps, roadmap]
license: MIT
argument-hint: "[horizon]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:direction

Synthesis. **Calls no MCP tools** — it consumes what the earlier skills produced.

## Rules That Apply Here

- **No recommendation without a cited number** traceable to a specific finding.
- **Surface threshold confidence.** Most defaults are provisional and uncalibrated;
  presenting them as settled invites expensive mistakes.
- **`dataTrust` propagates.** When it is not `trusted`, no conversion-based move may
  appear as a firm recommendation.
- **One change per day per entity.** Never propose several budget or audience edits to
  the same entity in one plan — the edits themselves reset the learning phase.
- **Read-only.** Everything here is advisory. The user executes in Ads Manager.

## Inputs

Baseline (`/tk:account`), findings (`/tk:diagnose`), patterns (`/tk:creative`), and
research (`/tk:research`) when it exists.

**Missing research:** do not run it automatically. Research spends query budget the
user has not approved, and on a metered free tier that is real money. Note that market
context is absent, state what it would add, and offer `/tk:research`. Then proceed
with what is available.

## Procedure

1. **Position.** Where the account actually is, in plain language. No jargon, no
   metric dump. Someone who has not read the diagnosis should understand it.
2. **Rank candidate moves** by money at stake × confidence ÷ effort. Confidence comes
   from the threshold rows and `dataTrust`, not from conviction.
3. **Cut to five at most.** A list of twelve is a way of avoiding the ranking.
4. **Write the stop list.** What to stop doing usually beats what to start, and it is
   the part most reports omit.
5. **State uncertainty** as its own section, not as hedging sprinkled through the
   recommendations.

## Move Format

```
[N] <move, one line>
  why      : <finding + metric + value + window>
  expect   : <what should change, and roughly how much>
  effort   : low | medium | high
  risk     : <what could go wrong, including learning-phase cost>
  confidence: <threshold confidence + dataTrust effect>
  kill     : <if X has not moved by <date>, revert>
```

Every move needs a kill criterion. A recommendation with no way to be wrong cannot be
learned from.

## Output

Use `templates/direction-report.md`. Sections: Position, Moves, Stop Doing,
Uncertainty, What Was Not Checked.

## Language

Read `locale.responseLanguage` from `.claude/.tk.json` — `vi` (default) or `en` — and
write prose in that language. An explicit request in the conversation overrides it for
the rest of the session.

Never translate metric names, numeric values, entity names, threshold keys, or
`dataTrust` values: the user has to be able to match them against TikTok Ads Manager.
Full rules in `rules/tiktok-output-language.md`.

## Workflow Position

**Previous:** `/tk:diagnose`, `/tk:creative`, optionally `/tk:research`
**Next:** none — this is the end of the chain. Re-run `/tk:diagnose` after the kill
dates to see whether the moves worked.
