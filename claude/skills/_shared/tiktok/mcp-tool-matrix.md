# MCP Tool Matrix

Keyed by **capability**, not by vendor. Skills and agents look up a capability here
and never name a vendor themselves. This file is the only place vendor names appear,
which is what makes the data source swappable when TikTok publishes an official
endpoint.

Last reviewed: 2026-08-01.

## Planes

| Plane | Answers | Required for |
|---|---|---|
| `ads` | where money went and what it bought | `/tk:diagnose` ads half, conversion claims |
| `organic` | how the channel is growing and what content holds attention | `/tk:diagnose` organic half, `/tk:creative` |
| `external` | what is happening outside this account | `/tk:research` Outside half |

## Capability Table

| Capability | Preferred tool | Plane | Vendor | Fallback | When unavailable |
|---|---|---|---|---|---|
| List linked data sources | `list_connections` | any | Detrics | — | Treat every plane as `unregistered`; run onboarding |
| List ad accounts / profiles | `list_accounts` | ads, organic | Detrics | `get_business_centers`, `get_authorized_ad_accounts` (ysntony) | Ask the user for the advertiser id and handle |
| Discover available fields | `list_fields` | ads, organic | Detrics | — | **Do not guess field names.** Report the limitation and stop |
| Query metrics (generic) | `query_marketing_data` | ads, organic | Detrics | `get_reports` (ysntony) | Plane is unusable; say so |
| Advertiser profile | `tiktok_ads_get_advertiser_info` | ads | AdsMCP | `list_accounts` | Currency and timezone unknown — flag every money figure as unverified |
| Campaign inventory | `tiktok_ads_get_campaigns` | ads | AdsMCP | `query_marketing_data` grouped by campaign | — |
| Ad group targeting and bid | `tiktok_ads_get_adgroup_details` | ads | AdsMCP | none | Targeting analysis unavailable; say so rather than inferring |
| Spend without conversion | `tiktok_ads_wasted_spend_audit` | ads | AdsMCP | `query_marketing_data` with spend and conversion, filtered client-side | Fallback costs more queries — budget accordingly |
| Pixel inventory | `tiktok_ads_get_pixel_list` | ads | AdsMCP | none | `dataTrust` cannot be established → `untrusted` |
| Pixel event volume | `tiktok_ads_get_pixel_event_stats` | ads | AdsMCP | none | `dataTrust` cannot be established → `untrusted` |
| Audience breakdown | `tiktok_ads_get_audience_breakdown` | ads | AdsMCP | `query_marketing_data` with demographic dimensions | — |
| Custom audiences | `tiktok_ads_get_custom_audiences` | ads | AdsMCP | none | Audience overlap analysis unavailable |
| Search on-platform content | `tiktok_search` | external | content MCP | web search | Outside half degrades to web-only; label it |
| Video metadata and engagement | `tiktok_get_post_details` | external | content MCP | web search | — |
| Video transcript | `tiktok_get_subtitle` | external | content MCP | none | Creative analysis loses script-level insight; say so |

## Vendor Notes

| Vendor | Covers | Auth | Cost model | Write? |
|---|---|---|---|---|
| **TikTok official** | ads only | browser OAuth on first connect, no developer app, expires after 30 days | TikTok Marketing API rate limits | **Yes — the surface includes write tools** |
| Detrics | ads + organic in one connection | OAuth to the vendor platform, API key in the MCP client | Metered per query; free tier is small | No — read-only |
| AdsMCP (`AdsMCP/tiktok-ads-mcp-server`) | ads only, 20 tools | OAuth via a TikTok for Business developer app, tokens stored locally | Bound by TikTok Marketing API v1.3 rate limits | No — read-only in the published tool set |
| ysntony (`ysntony/tiktok-ads-mcp`) | ads only, 6 tools | Personal access token | API rate limits | No — read-only |
| content MCP (`seym0n/tiktok-mcp`) | public content | Third-party API key | Vendor-dependent | No |

**Privacy fact that must be surfaced to the user, not buried here:** hosted vendors
hold the user's TikTok OAuth token. Self-hosted servers keep tokens on the user's own
machine but require a developer app that TikTok must approve.

## Official TikTok MCP — Available

TikTok publishes a public remote MCP endpoint. It is the preferred ads source: no
developer app, no approval wait, and no third party between the account and the agent.

| Variant | URL | Tools |
|---|---|---|
| Full disclosure | `https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat` | ~400 loaded at connect |
| Progressive disclosure | `https://business-api.tiktok.com/open_mcp/tt-ads-mcp-layer` | ~40 core, rest on demand |

Config is a bare URL — no command, no key:

```json
{ "mcpServers": { "tiktok-ads": { "url": "<variant url>" } } }
```

Three properties that change how the kit must behave:

1. **Authorization expires after 30 days.** A plane that worked last month can be
   `registered-but-empty` today for no reason other than elapsed time. `/tk:connect`
   should name re-authorization as the first thing to check on an ads plane that was
   previously live.
2. **The surface is write-capable.** Campaign creation, budget edits, and status
   changes are all reachable. This kit's read-only guarantee is now **instruction, not
   capability** — see `rules/tiktok-data-rules.md` rule 6. Treat that rule as
   load-bearing rather than descriptive.
3. **Tool count is large.** The full variant loads ~400 tools at connect, which is real
   context pressure alongside the kit's own skills. Prefer the layered variant when a
   session is already heavy.

It does **not** cover organic. Follower, video, and completion data still require a
vendor that reads TikTok Organic.

## Swap Rule

Adding or replacing a vendor means editing this file and nothing else. If a change
requires touching a skill or agent, the abstraction has leaked and the leak is the
bug.
