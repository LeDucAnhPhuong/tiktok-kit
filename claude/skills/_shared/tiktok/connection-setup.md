# Connection Setup

Concrete onboarding per vendor, with the real cost of each. Lives here rather than in
a skill folder so vendor names stay confined to `_shared/tiktok/` and the swap seam
holds.

Present **both** paths with their trade-offs. Do not default silently — which token
custody model a user accepts is their decision, not the kit's.

## Path A — TikTok official, ads only

The default. Straight to TikTok, nobody in the middle.

| | |
|---|---|
| Setup time | ~2 minutes |
| Approval wait | none — no developer app required |
| Cost | free; bound by TikTok Marketing API rate limits |
| Coverage | **ads only** |
| **Token custody** | TikTok itself. No third party involved |

Steps:

1. Add the server. Config is a bare URL:

```json
{
  "mcpServers": {
    "tiktok-ads": {
      "url": "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat"
    }
  }
}
```

   Use `.../tt-ads-mcp-layer` instead when context is tight — ~40 core tools loaded
   with the rest discovered on demand, versus ~400 loaded up front.

2. Restart the client. On first connect it prompts you to sign in to TikTok Ads
   Manager and authorize.
3. Re-run `/tk:connect`.

**Authorization lasts 30 days.** After that the plane goes quiet and needs
re-authorizing with the same account — the most likely cause of an ads plane that
worked last month and does not today.

**This surface can write.** Campaign creation and budget edits are reachable through
it. This kit does not use them, but that restraint is a rule, not a wall.

No organic coverage. Pair with Path B when follower and content data matter.

## Path B — Hosted vendor, covers both planes

Covers ads and organic through one connection and one key.

| | |
|---|---|
| Setup time | ~15 minutes |
| Approval wait | none |
| Cost | free tier includes MCP access at roughly 35 queries/month, no card required |
| Coverage | ads + organic |
| **Token custody** | **A third-party company holds the user's TikTok OAuth token** |

Steps:

1. Create a vendor account (Detrics, `app.detrics.io`) and link TikTok Ads and TikTok
   Organic via OAuth.
2. Get an API key from the vendor's MCP page.
3. Add to the MCP client config:

```json
{
  "mcpServers": {
    "detrics": {
      "command": "npx",
      "args": ["-y", "detrics"],
      "env": { "DETRICS_API_KEY": "<key>" }
    }
  }
}
```

4. Restart the client, then re-run `/tk:connect`.

Tools exposed: `list_connections`, `list_accounts`, `list_fields`,
`query_marketing_data`.

## Path C — Self-hosted, ads only

No third party holds the token, but the setup is longer and the coverage is narrower.

| | |
|---|---|
| Setup time | ~30 minutes after approval |
| Approval wait | **days — TikTok must approve a developer app** |
| Cost | free; bound by TikTok Marketing API v1.3 rate limits |
| Coverage | ads only |
| **Token custody** | tokens stored locally at `~/.tiktok_ads_mcp/tokens.json` |

Steps:

1. Register an app in TikTok for Business Developers, request Marketing API
   permissions, wait for approval.
2. Clone `AdsMCP/tiktok-ads-mcp-server`. Requires Python 3.10+ and `uv`.
3. Add to the MCP client config:

```json
{
  "mcpServers": {
    "tiktok-ads": {
      "command": "uv",
      "args": ["--directory", "<path>", "run", "python", "run_server.py"],
      "env": { "TIKTOK_APP_ID": "<id>", "TIKTOK_APP_SECRET": "<secret>" }
    }
  }
}
```

4. Run the login tool to complete OAuth, then re-run `/tk:connect`.

Adds three capabilities Path A cannot provide: wasted-spend audit, pixel event stats,
and raw ad group targeting.

Treat the token file like a password. Deleting it disconnects the account.

## Path D — External plane, optional

Public content search and transcripts, for the Outside half of research.
`seym0n/tiktok-mcp`, Node 18+, requires a third-party API key (TikNeuron).

```json
{
  "mcpServers": {
    "tiktok-content": {
      "command": "node",
      "args": ["<path>/build/index.js"],
      "env": { "TIKNEURON_MCP_API_KEY": "<key>" }
    }
  }
}
```

Tools: `tiktok_search`, `tiktok_get_post_details`, `tiktok_get_subtitle`.

## Recommended Combination

**Start with Path A.** It is the fastest, costs nothing, and puts no third party
between the account and the agent.

Add **Path B** when organic matters — it is the only route to follower, video, and
completion data, and Path A does not cover any of it.

**Path C** only when you specifically want tracking-health verification without a
hosted vendor. **Path D** only when research is a regular need.

A common pairing is A + B: official for ads, vendor for organic. Both planes live, and
only the organic half passes through a third party.

## Budget By Tier

Set `budget.maxQueriesPerRun` in `.tk.json` to match the plan:

| Situation | Suggested |
|---|---|
| Metered vendor, free tier | 6 — roughly five runs per month |
| Metered vendor, paid tier | 12 (default) |
| Official or self-hosted — rate-limited, not metered | 20 |

## Coverage At A Glance

| Plane | Path A official | Path B hosted | Path C self-hosted | Path D content |
|---|---|---|---|---|
| ads | ✅ | ✅ | ✅ | — |
| organic | — | ✅ | — | — |
| external | — | — | — | ✅ |
| pixel health → `dataTrust` | check the tool list | — | ✅ | — |
