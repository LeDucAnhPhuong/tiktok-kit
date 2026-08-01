---
name: tk:connect
description: Verify that TikTok data actually reaches Claude — probes each MCP data plane with a real call, tells apart a missing server from a linked-but-empty one, reports exactly what is broken, and records the result in .tk.json. Setup itself is done by the `tk connect` CLI, which keeps API keys out of the conversation.
user-invocable: true
when_to_use: "Invoke to check whether TikTok ads and organic data are reachable, or when another tk: skill reports a missing plane. Not for entering credentials — run the `tk connect` CLI for that."
category: tiktok
keywords: [tiktok, mcp, connect, verify, kiem tra, kiểm tra, ket noi, kết nối, khong thay du lieu, không thấy dữ liệu, plane, ad account, tai khoan, tài khoản]
license: MIT
argument-hint: "[plane]"
metadata:
  author: tiktok-kit
  version: "0.2.0"
---

# tk:connect

Checks whether the data planes are live. **Verification only** — configuration happens
in the CLI.

## Why The Split

Writing MCP config is deterministic file editing, and it involves an API key. A key
pasted into a Claude conversation is in the transcript and has been sent to the model.
The `tk connect` CLI reads it from a muted terminal instead, so it never leaves the
machine.

What the CLI *cannot* do is tell whether a configured server actually returns data —
that requires calling the MCP tools, which only happens inside a Claude Code session.
That is this skill's entire job.

## Rules That Apply Here

- **Never ask the user for a key, token, or secret.** Point them at `tk connect`.
- **Never write a credential** into `.tk.json`, a report, or any other file.
- Report what is broken specifically. "Not connected" is not actionable.

## Procedure

### 1. Probe

For each plane, attempt its listing capability from `rules/tiktok-mcp-routing.md`.
Classify into one of three states — the fix differs for each, so collapsing them wastes
the user's time:

| State | Symptom | Fix |
|---|---|---|
| `unregistered` | the tool is absent from the session entirely | run `tk connect`, then restart Claude Code |
| `registered-but-empty` | tool responds, returns no sources or accounts | link the TikTok account on the vendor platform |
| `connected` | tool returns real accounts or fields | none |

Four causes account for nearly every gap, and all four look identical to a plain "not
connected". Work down this list before suspecting anything else:

1. **Client not restarted.** The server is in `.mcp.json` but the session predates it,
   so the tool is absent entirely.
2. **Project server not approved.** Claude Code gates project-scoped `.mcp.json`
   servers behind an approval prompt. Declined or dismissed, the server never loads.
   `claude mcp reset-project-choices` clears the decision.
3. **Never authorized.** The server connects, but no OAuth has happened, so every call
   returns nothing. The fix is `/mcp` → select the server → Authenticate. This is the
   most common false alarm: the setup looks complete and reads empty.
4. **Authorization expired.** The official ads server authorizes for 30 days. A plane
   that worked last month goes quiet with no other change. Same fix as 3.

When the ads plane is `registered-but-empty` and `.tk.json` records the official
vendor, name causes 3 and 4 first. Do not describe the setup as broken.

### 2. Report

Print a plane table: `ads`, `organic`, `external` — state, vendor, and what is blocked
by each gap. Be concrete about consequences:

- no ads plane → no spend, structure, or conversion analysis
- no pixel capability → `dataTrust` can never reach `trusted`
- no organic plane → no follower or content analysis
- no external plane → research degrades to web-only

### 3. Persist

Update `mcp.<plane>.status` in `.claude/.tk.json` with what was actually observed.
Leave `vendor` as the CLI set it.

## Output

Plane status table, the specific blocker per gap, and the single next command to run.

When nothing is connected, say so plainly and stop. Never fabricate a baseline.

## Workflow Position

**Previous:** `tk connect` (CLI)
**Next:** `/tk:account` — baseline the account once at least one plane is live.
