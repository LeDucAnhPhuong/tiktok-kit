# Connection Setup

Concrete onboarding per vendor, with the real cost of each. Lives here rather than in
a skill folder so vendor names stay confined to `_shared/tiktok/` and the swap seam
holds.

Present **both** paths with their trade-offs. Do not default silently — which token
custody model a user accepts is their decision, not the kit's.

## Path A — Hosted, covers both planes

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

## Path B — Self-hosted, ads only

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

## Path C — External plane, optional

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

Path A alone is enough to start and is the only one usable the same day. Path B is
worth adding when tracking-health verification matters — without it `dataTrust` can
never reach `trusted`. Path C only when research is a regular need.

## Budget By Tier

Set `budget.maxQueriesPerRun` in `.tk.json` to match the plan:

| Situation | Suggested |
|---|---|
| Free tier, metered monthly | 6 — roughly five runs per month |
| Paid tier | 12 (default) |
| Self-hosted only, rate-limited not metered | 20 |

## Official TikTok Path — Not Available

TikTok's own Ads MCP and Agentic Hub exist but expose no public endpoint or tool
schema for an external client to connect to. When that changes, this file and
`mcp-tool-matrix.md` are the only two files that need editing.
