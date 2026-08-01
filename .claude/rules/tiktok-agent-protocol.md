# TikTok Agent Protocol

How `tk:*` skills delegate to `tiktok-*` agents.

## Postures

Exactly one agent may recommend. Keeping that boundary is what stops advice from
borrowing the authority of data.

| Agent | Posture | May recommend? |
|---|---|---|
| `tiktok-data-analyst` | descriptive | **no** |
| `tiktok-creative-strategist` | explanatory | **no** |
| `tiktok-trend-researcher` | outside-in reporting | **no** |
| `tiktok-growth-strategist` | prescriptive synthesis | **yes** |

## Delegation Contract

Every agent prompt from a skill carries all of:

1. The scoped question — not the user's whole request
2. Which data planes are available, per `.tk.json`
3. The baseline block, including `dataTrust`
4. **Remaining query budget** — a number, not a policy
5. Where to write its report
6. Acceptance criteria for the return

Omitting item 4 is the most expensive mistake available here: agents that assume their
own budget will collectively overrun a metered quota in a single run.

## Budget Allocation

Budget is allocated by the orchestrating skill and passed down. It is never assumed
per-agent.

When fanning out — for example one analyst per plane — divide the remaining budget
across the fan-out **before** dispatching. Two analysts each spending the full budget
is a doubled bill.

## Delegation Map

| Skill | Agent | Parallel |
|---|---|---|
| `/tk:diagnose` | `tiktok-data-analyst` | yes — one per plane |
| `/tk:creative` | `tiktok-creative-strategist` | after performers are known |
| `/tk:research` | `tiktok-trend-researcher` + `tiktok-data-analyst` | yes — Outside and Inside concurrently |
| `/tk:direction` | `tiktok-growth-strategist` | no — synthesis is serial |

## Reports

Agents write to the reports directory from `.tk.json` `paths.reports`. The strategist
reads those files rather than having full payloads re-passed through the skill, which
is the reason the delegation exists at all.

## Status Protocol

Every agent ends with:

```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

Handle `BLOCKED` and `NEEDS_CONTEXT` by changing context, scope, or approach. Never
re-run the same failing prompt.

## Enforcement

None. This protocol is instruction, like everything else in this kit. The compensating
control is the fixture audits in each skill's validation section — in particular the
bait test that checks whether `tiktok-data-analyst` can be provoked into recommending.
