---
name: tk:connect
description: Connect TikTok ads and organic data to Claude over MCP. Detects which data planes are reachable, distinguishes a missing MCP server from an empty one, walks through setup with the token-custody trade-off stated up front, and records connection state in .tk.json.
user-invocable: true
when_to_use: "Invoke when TikTok data is not reachable, when setting up the kit for the first time, or when a tk: skill reports a missing plane. Not for connecting non-TikTok data sources."
category: tiktok
keywords: [tiktok, mcp, connect, setup, ket noi, kết nối, cai dat, cài đặt, onboarding, ad account, tai khoan, tài khoản]
license: MIT
argument-hint: "[plane]"
metadata:
  author: tiktok-kit
  version: "0.1.0"
---

# tk:connect

Entry point. Establishes which TikTok data the kit can actually see.

## Rules That Apply Here

Restated because `rules/tiktok-data-rules.md` may not be loaded:

- **Never ask for, or write, credentials.** Tokens belong in the MCP client config or
  on the vendor platform. `.tk.json` records connection state only.
- **Disclose token custody before the user authorizes**, not after. Hosted vendors
  hold the user's TikTok OAuth token.
- Present both setup paths with their real costs. Do not pick for the user.

## Procedure

### 1. Probe

Attempt the source-listing and account-listing capabilities from
`rules/tiktok-mcp-routing.md`. Classify each plane into one of three states — the fix
differs for each, so collapsing them wastes the user's time:

| State | Meaning | What the user must do |
|---|---|---|
| `unregistered` | the tool itself is absent from the client | add the MCP server to the client config and restart |
| `registered-but-empty` | tool responds, no sources linked | link the TikTok account on the vendor platform |
| `connected` | data reachable | nothing |

### 2. Report

Print a plane table: `ads`, `organic`, `external` with state and vendor.

### 3. Guide

For anything not `connected`, load `skills/_shared/tiktok/connection-setup.md` and
present the applicable path. State plainly:

- what it costs
- how long approval takes
- **who ends up holding the TikTok OAuth token**

### 4. Persist

Write `mcp.<plane>.status` and `mcp.<plane>.vendor` into `.claude/.tk.json`. Set
`budget.maxQueriesPerRun` from the tier table in the setup reference.

Never write a token, key, or secret into this file.

## Output

- Plane status table
- Setup steps for missing planes, with trade-offs
- Confirmation of what was written to `.tk.json`
- What the user can run next

## Workflow Position

**Next:** `/tk:account` — baseline the account once at least one plane is connected.

With no plane connected, say so directly and stop. Do not fabricate a baseline.
