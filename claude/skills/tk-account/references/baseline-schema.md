# Baseline Schema

The block `/tk:account` emits and every downstream skill consumes. Keeping it stable
means later skills never re-query what has already been fetched.

```yaml
baseline:
  generatedAt: <ISO date>
  window: { days: 28, excludesPartial: true }

  planes:
    ads: connected | registered-but-empty | unregistered
    organic: connected | registered-but-empty | unregistered
    external: connected | registered-but-empty | unregistered

  identity:
    advertiserId: <string | null>
    organicHandle: <string | null>
    currency: <ISO code | null>      # never assumed — read from the advertiser profile
    timezone: <string | null>
    accountStatus: <string | null>

  dataTrust:
    verdict: trusted | conversion-suspect | untrusted
    reason: <one line — what was observed>
    pixels:
      - id: <string>
        eventsLast14: <number>
        eventsPrev14: <number>
        deltaPct: <number>
        flagged: <boolean>

  scale:
    spend: { value: <number>, currency: <ISO code> }
    campaignCount: <number>
    adGroupCount: <number>
    followers: <number | null>
    followerDeltaPct: <number | null>
    postsInWindow: <number | null>

  structure:
    scopedTo: <string>               # e.g. "top 10 campaigns by spend"
    objectiveMix:
      - objective: <string>
        campaigns: <number>
        spendShare: <number>

  budget:
    maxQueriesPerRun: <number>
    queriesSpent: <number>

  gaps:
    - <what could not be fetched, and the consequence>
```

## Field Rules

- **`currency`** — from the advertiser profile capability. Never inferred from a
  number's magnitude, never defaulted to USD.
- **`dataTrust.verdict`** — always present. `untrusted` is a valid answer; omitting the
  field is not.
- **`dataTrust.reason`** — one line stating what was actually observed, so a later
  reader can judge the verdict rather than trusting it.
- **`structure.scopedTo`** — states the scope explicitly. A scoped view that reads as
  complete is worse than no view.
- **`gaps`** — every unavailable capability, with its consequence spelled out. An empty
  `gaps` list means everything was reachable, and must not be used to hide a failure.
- **`budget.queriesSpent`** — actual count, so the next skill knows what remains.
