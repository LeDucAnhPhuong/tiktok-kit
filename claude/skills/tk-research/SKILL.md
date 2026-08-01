---
name: tk:research
description: Research TikTok trends, competitors, formats, hashtags, and audiences from live sources, then pair every outside finding with this account's own history from MCP. Answers Outside, Inside, and Fit — never market-only. Dates and cites every claim, and separates announced from available.
user-invocable: true
when_to_use: "Invoke for TikTok trends, competitor teardowns, format research, or market questions about the platform. Not for research outside TikTok — use a general research skill or plain web search for that."
category: tiktok
keywords: [tiktok, research, nghien cuu, nghiên cứu, xu huong, xu hướng, trend, doi thu, đối thủ, competitor, hashtag, sound, viral, niche, thi truong, thị trường]
license: MIT
argument-hint: "[trend | competitor <handle> | audience | format] [question]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:research

Market research that knows your account.

The pairing is the point: market-only research is something anyone can write, and
account-only analysis has no outside reference. Neither half alone is this skill.

## Rules That Apply Here

Restated because `rules/tiktok-research-rules.md` may not be loaded:

- **Never answer from model memory.** TikTok knowledge is stale by construction. Look
  it up, every time.
- **Three independent sources minimum** for a market claim. Three outlets restating one
  press release count as one.
- **Date every claim.** Flag anything past its staleness window.
- **Label official / reported / speculative.** Coverage routinely restates
  announcements as shipped capability.
- **Announced is not available.** Say which it is.
- **Cite URLs.**
- **Always attempt the Inside half.** When no plane is connected, say so — never let
  market-only output go out looking complete.

## Modes

Subcommands, not flags:

| Command | Purpose |
|---|---|
| `/tk:research trend` | what is rising in the niche, with a decay estimate |
| `/tk:research competitor <handle>` | teardown: format, cadence, hooks, apparent positioning |
| `/tk:research audience` | who engages, and where that overlaps paid targeting |
| `/tk:research format` | which content formats win, on-platform and for this account |
| `/tk:research` | free-form, still routed through Outside / Inside / Fit |

Per-mode procedure: `references/research-modes.md`.

## Procedure

1. **Declare cost.** Sum the Inside-half templates and compare against remaining
   budget. Narrow scope rather than overrunning.
2. **Run both halves concurrently.** Outside via `tiktok-trend-researcher`, Inside via
   `tiktok-data-analyst`. They do not depend on each other.
3. **Assemble** into `templates/research-report.md`.

## The Three Sections

| Section | Source | Answers |
|---|---|---|
| **Outside** | web + on-platform search | what is happening in the niche |
| **Inside** | ads + organic MCP | what this account has already seen |
| **Fit** | synthesis | what it means here, and what to test |

**All three always appear.** A missing plane produces a section stating what could not
be checked. Dropping the Inside section silently is the failure this structure exists
to prevent.

## Output

The three-section report, source list with dates and labels, and a short list of
concrete tests worth running.

## Workflow Position

**Previous:** any
**Next:** `/tk:direction` — fold research into a prioritized plan.
