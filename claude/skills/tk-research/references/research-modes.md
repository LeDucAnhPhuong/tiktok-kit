# Research Modes

Per-mode procedure. Every mode produces Outside, Inside, and Fit.

## `trend`

**Outside:** what is rising in the niche — formats, sounds, hashtags, topics. Each with
a first-observed date and an estimate of where it sits in its decay curve. A trend
already three weeks old is a different proposition from one three days old, and saying
"this is trending" without that distinction is close to useless.

**Inside:** has this account run anything similar? Pull past videos matching the theme
or format and report how they actually did.

**Fit:** whether this account has already proven or disproven the trend for itself, and
what a cheap test would look like.

**Cost:** Inside half ≈ 2 queries.

## `competitor <handle>`

**Outside:** format mix, posting cadence, hook patterns, apparent positioning, and
which of their content overperforms *their own* median — not yours. Absolute view
counts across accounts of different sizes tell you nothing.

**Inside:** where this account overlaps them, and where it does not. Compare cadence and
format mix, not raw reach.

**Fit:** what is worth borrowing, what is a function of their audience size, and what
would not transfer.

**Cost:** Inside half ≈ 2 queries.

**Limit:** public data only. Their spend, targeting, and conversion rates are not
observable. Never infer a competitor's budget from their reach.

## `audience`

**Outside:** who engages with this niche on the platform generally, and what content
they respond to.

**Inside:** demographics engaging organically, versus demographics paid targeting is
buying. Apply `min_segment_impressions` before computing any rate.

**Fit:** whether targeting matches the audience actually responding, and which
untargeted segment is worth a test.

**Cost:** Inside half ≈ 3 queries.

## `format`

**Outside:** which content formats are performing in the niche — talking head,
demonstration, listicle, story, UGC-style — with dated evidence.

**Inside:** which formats this account has already tried and how each performed.
Compare completion rate within similar durations only.

**Fit:** formats proven here, formats untested here, formats tried and failed. The
third group matters most — it is the one an outside-only view would recommend again.

**Cost:** Inside half ≈ 2 queries.

## Free-Form

Route the question into the nearest mode. If it fits none, still produce all three
sections: what the outside says, what this account's data shows, what it means here.

## Cross-Mode Discipline

- **Outside runs even when the Inside half is unavailable** — with the gap stated.
- **Inside runs even when the external plane is missing** — Outside degrades to
  web-only, labeled as such.
- Neither half waits on the other.
- Cost is declared before either starts.
