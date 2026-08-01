# Diagnostic Thresholds

What number counts as a problem.

## Every Value Here Is Provisional

These defaults were authored from platform documentation and general practice, **not
calibrated against any real account**. They have never been checked against outcomes.

Consequences, stated plainly because a threshold that looks precise invites misplaced
trust:

- A confident-sounding recommendation built on an uncalibrated threshold can cost real
  money.
- `/tk:direction` must surface the confidence column in its output, not hide it.
- Provisional thresholds justify *investigation*, never an automatic conclusion.

Override per account in `.tk.json` under `thresholds`. Flip a row to `measured` only
after checking it against that account's own outcomes, and record when.

## Table

| Key | Metric | Direction | Default | Confidence | Provenance |
|---|---|---|---|---|---|
| `wasted_spend_floor` | spend on an ad group with zero conversions | above | 2% of account spend in the window | provisional | Arbitrary floor to filter noise. Needs calibration against account size |
| `cpa_regression` | CPA versus previous equal window | above | +25% | provisional | Common practice; no account evidence |
| `roas_regression` | ROAS versus previous equal window | below | −20% | provisional | Common practice; no account evidence |
| `ctr_floor` | ads CTR | below | 0.5% | provisional | Broad platform-level guidance; varies heavily by objective and placement |
| `six_second_view_rate_floor` | 6-second views ÷ impressions | below | 10% | provisional | Attention proxy. Useful when conversion data is untrusted |
| `completion_rate_floor` | organic completion rate | below | 20% | provisional | Strongly length-dependent — compare only within similar durations |
| `engagement_rate_floor` | organic interactions ÷ views | below | 3% | provisional | Varies by niche; the weakest row in this table |
| `follower_growth_stall` | follower change over 28 days | below | +1% | provisional | Stall signal, not a failure signal |
| `pixel_event_drop` | pixel events, last 14 days vs previous 14 | below | −30% | provisional | Chosen to catch breakage without firing on seasonality |
| `min_segment_impressions` | impressions in an audience segment | below | 1000 | provisional | Below this, derived rates are noise. Drop the segment |
| `min_videos_for_pattern` | videos available for creative pattern analysis | below | 8 | provisional | Below this, `/tk:creative` reports hypotheses, not findings |
| `learning_phase_days` | days after a budget or audience change | within | 7 | provisional | Platform guidance varies; treat as a caution window |
| `posting_cadence_drop` | posts per week vs previous period | below | −40% | provisional | Rules out "the algorithm changed" before investigating further |

## Rules Of Use

1. **A crossed threshold is a question, not a verdict.** Report what crossed, by how
   much, over which window, then investigate.
2. **Never stack thresholds into a score.** Three provisional numbers combined produce
   a fourth number with worse confidence and a falsely authoritative look.
3. **Segment minimums come first.** Apply `min_segment_impressions` before computing
   any rate, or the output is noise dressed as insight.
4. **Learning phase suppresses everything.** Inside `learning_phase_days` of a known
   change, performance thresholds do not apply.
5. **`dataTrust` gates the conversion rows.** When tracking health is not `trusted`,
   `cpa_regression`, `roas_regression`, and `wasted_spend_floor` cannot fire as
   conclusions. Use attention proxies instead.
6. **Cite the row.** Any finding referencing a threshold names the key and its
   confidence.

## Calibration Log

Empty. Add a row per threshold as it is checked against real outcomes.

| Date | Key | Old | New | Basis |
|---|---|---|---|---|
| — | — | — | — | — |
