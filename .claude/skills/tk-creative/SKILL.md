---
name: tk:creative
description: Explain why TikTok videos won or lost — opening hook, pacing, on-screen text, thumbnail, mobile framing, audio — by analyzing the actual media alongside its metrics. Separates creative effect from spend and placement confounds, and labels small-sample output as hypotheses.
user-invocable: true
when_to_use: "Invoke to understand why specific TikTok content performed the way it did, or to extract repeatable patterns from winners. Not for finding which videos won — that is /tk:diagnose."
category: tiktok
keywords: [tiktok, creative, video, hook, noi dung, nội dung, vi sao viral, vì sao viral, thumbnail, completion rate, phan tich video, phân tích video, teardown]
license: MIT
argument-hint: "[video-url | scope]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:creative

The only skill that answers *why*. No MCP server reads video, so this is where
multimodal analysis does the work that metrics cannot.

## Rules That Apply Here

- **Minimum sample.** Below `min_videos_for_pattern`, output is labeled hypotheses to
  test, never findings. Small-sample creative analysis is the fastest way to produce
  confident nonsense.
- **Never attribute to creative what spend or placement explains.** If `/tk:diagnose`
  flagged a confound on a video, that video cannot anchor a creative conclusion.
- Compare completion rates only within similar durations — the metric is strongly
  length-dependent.
- Declare query cost before fetching.

## Procedure

### 1. Take the performers

Top and bottom videos from `/tk:diagnose`, with their metrics and any confound flags
already attached. Do not re-rank them here.

### 2. Gather context

Video metadata and, where the external plane is connected, transcripts. Without
transcripts, script-level analysis is unavailable — say so rather than inferring the
script from the caption.

### 3. Analyze the media

Work through `references/creative-analysis-rubric.md` against the actual video and
thumbnail. This step requires viewing the media, not reading about it.

### 4. Extract patterns

Three buckets, kept separate:

| Bucket | Meaning |
|---|---|
| Shared by winners | present in most top performers, absent from most bottom |
| Shared by losers | the inverse |
| Confounded | correlates with performance but also with spend, placement, duration, or posting time |

The confounded bucket is not filler. Moving a trait there instead of into "winners" is
usually the most honest thing this skill does.

### 5. State confidence

Sample size, whether winners and losers actually differ on the trait, and what would
falsify each pattern.

## Output

- Pattern set across the three buckets
- Sample size and whether it met the minimum
- For each pattern: the evidence, and a concrete test that would confirm or kill it
- Explicit statement when output is hypotheses rather than findings

## Language

Read `locale.responseLanguage` from `.claude/.tk.json` — `vi` (default) or `en` — and
write prose in that language. An explicit request in the conversation overrides it for
the rest of the session.

Never translate metric names, numeric values, entity names, threshold keys, or
`dataTrust` values: the user has to be able to match them against TikTok Ads Manager.
Full rules in `rules/tiktok-output-language.md`.

## Workflow Position

**Previous:** `/tk:diagnose`
**Next:** `/tk:direction` — turn patterns into prioritized moves.
