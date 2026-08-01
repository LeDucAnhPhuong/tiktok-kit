# Cross-Plane Checks

Findings that neither the ads view nor the organic view can produce alone. This is
what makes the kit worth more than a platform dashboard.

Every check below requires the glossary. Comparing raw "views" across planes produces
a confident, meaningless number.

## 1. Unsupported Organic Winner

**Signal:** an organic theme or format is well above the account's own median
engagement and completion, and no paid campaign runs anything similar.

**Why it matters:** the account has already proven demand for something it is not
paying to amplify. Usually the highest-value finding available.

**How:** rank organic videos by completion rate (`organic.video_engagement`), compare
top themes against the objective and creative mix in the ads structure.

**Confounds:** a single viral outlier is not a theme. Require the pattern across at
least `min_videos_for_pattern` videos before calling it one.

## 2. Audience Mismatch

**Signal:** the demographics engaging organically differ materially from the
demographics paid targeting is buying.

**Why it matters:** either targeting is wrong, or the organic audience is a segment
worth testing. Both are actionable; the finding does not say which.

**How:** `ads.audience_breakdown` against organic engagement demographics. Apply
`min_segment_impressions` before computing any rate.

**Confounds:** paid targeting is a chosen constraint. A mismatch may be deliberate.
Report it as a question, not an error.

## 3. Creative Performing Differently Across Planes

**Signal:** the same or near-same creative shows strong organic completion and weak
paid 6-second view rate, or the reverse.

**Why it matters:** isolates creative quality from delivery. If it works organically
and fails in ads, the problem is targeting, placement, or bid — not the video.

**How:** match creative between planes by title, posting date, or asset id.
Compare organic completion rate against paid complete-view rate — per the glossary
this is the closest true pair.

**Confounds:** paid delivery reaches cold audiences, organic reaches warm followers.
Some gap is expected and normal. Only a large gap is a finding.

## 4. Paid Spend Against Declining Organic Signal

**Signal:** spend is flat or rising on a theme whose organic engagement has been
falling for several weeks.

**Why it matters:** organic engagement often turns before paid metrics do, because
paid can buy delivery for a while after interest fades.

**How:** `ads.trend_by_period` against `organic.growth_trend` segmented by theme.

**Confounds:** seasonality moves both. Check whether the whole account moved together
before attributing the decline to one theme.

## 5. Cadence Explains The Reach Drop

**Signal:** organic reach fell and posting volume fell by a similar proportion.

**Why it matters:** rules out the "algorithm changed" narrative that otherwise drives
weeks of misdirected work. Cheap, and worth running first.

**How:** `organic.posting_cadence` over 56 days, weekly.

**Confounds:** none worth noting. When cadence explains it, say so plainly and stop.

## 6. Attribution Blind Spot

**Signal:** organic activity is high, paid conversions rose, and no organic conversion
is recorded anywhere.

**Why it matters:** organic-assisted conversions are credited to paid. Concluding
"organic contributes nothing" from this data is a measurement artifact, not a fact.

**How:** not directly measurable with the available capabilities. State the limitation
explicitly whenever comparing plane contribution.

**Confounds:** this check produces a caveat, never a finding. It exists so the kit does
not confidently under-credit organic.

## Discipline

- A cross-plane finding names both sides, both windows, and the glossary pair used.
- Where a confound applies and cannot be ruled out, the finding is a question.
- When `dataTrust` is not `trusted`, checks 4 and 6 lose their conversion component
  and must be reported on attention metrics alone.
