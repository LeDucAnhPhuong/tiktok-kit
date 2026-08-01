# TikTok Kit (`tk`)

A Claude Code kit that reads your TikTok **ads and organic** data over MCP, works out
what is actually happening in the account, and produces a prioritized growth direction.

**Read-only.** The kit never writes to TikTok. It analyzes and recommends; you execute
in Ads Manager.

## Install

```bash
npm install -g tiktok-kit
tk init
```

That is the whole setup on the CLI side. `tk init` installs the kit and connects TikTok
Ads — **no API key, no developer app, no questions**. It writes `.mcp.json` pointing at
TikTok's own MCP server.

Then, inside Claude Code:

1. **Restart** so the new server is picked up.
2. **Approve** the project MCP server when prompted — Claude Code gates project-scoped
   `.mcp.json` servers before first use.
3. **`/mcp`** → pick `tiktok-ads` → **Authenticate**. A browser opens: sign in to TikTok
   Ads Manager, review the permissions, click Authorize.
4. **`/tk:connect`** to verify data is flowing.

Step 3 is the one people skip. Without it the server is connected but unauthorized, and
every plane reads empty — which looks exactly like a broken setup.

Works standalone. If ClaudeKit is installed, `tk init` registers itself in `.ck.json`
so the two kits do not overwrite each other's settings.

## Commands

| Command | Does |
|---|---|
| `tk init [-g]` | install the kit and connect TikTok Ads |
| `tk init --layered` | connect the lighter ~40-tool server instead of the full ~400 |
| `tk init --no-connect` | install only, leave `.mcp.json` alone |
| `tk connect` | reconnect, or switch tool surface |
| `tk connect --advanced` | add other sources — **organic data lives here** |
| `tk status` | install mode, payload version, connected data planes, query budget |
| `tk remove [-g]` | remove assets and unregister |

Nothing prompts, so scripted and CI installs work unattended.

**Authorization lasts 30 days.** When an ads plane that worked last month goes quiet,
re-authorizing is almost always the fix.

## Skills

```
/tk:connect → /tk:account → /tk:diagnose → /tk:creative → /tk:direction
                                       ↘  /tk:research  ↗
```

| Skill | Does |
|---|---|
| `/tk:connect` | detect which data planes are reachable, guide setup |
| `/tk:account` | baseline the account, check tracking health, emit `dataTrust` |
| `/tk:diagnose` | find what is wrong across paid and organic, including cross-plane mismatches |
| `/tk:creative` | explain *why* videos won or lost, from the actual media |
| `/tk:research` | market research paired with your own account history |
| `/tk:direction` | at most five ranked moves, each with a kill criterion |

`/tk:research` takes subcommands: `trend`, `competitor <handle>`, `audience`, `format`.

## Agents

`tiktok-data-analyst` (descriptive only) · `tiktok-creative-strategist` ·
`tiktok-trend-researcher` · `tiktok-growth-strategist` (the only one permitted to
recommend).

That separation is deliberate: advice carried inside a data report inherits the
authority of the data.

## Connecting Your Data

`tk init` connects TikTok's official MCP server. Nothing to configure: the entry is a
URL, and authorization happens in the browser.

The official server covers **ads only**. For follower, video, and completion data you
need a second source:

```bash
tk connect --advanced
```

That menu holds a hosted vendor (ads + organic, needs an API key, **a third party holds
your TikTok token**), a self-hosted server (ads only, needs a TikTok developer app that
TikTok must approve), and a content source for research. Each states its trade-off
before you authorize anything.

### Credentials

The official path stores none — `.mcp.json` holds only a URL.

Advanced sources that do need a key read it from a muted terminal and write it to
`.mcp.json`, then add that file to `.gitignore` because it is plaintext. Setup lives in
the CLI precisely so a key never lands in a Claude conversation transcript. `.tk.json`
records connection *state* only, never a token.

### You still need real history

The kit compares 28 days against the previous 28. An account younger than about two
months produces noise, not insight — no amount of tooling fixes that.

## What This Kit Does Not Do

- Write to TikTok — no campaign creation, status changes, budget edits, or uploads
- Publish or schedule content
- Connect to TikTok's official Agentic Hub — it exposes no public endpoint for
  external clients yet. When it does, only two files need to change

## Honest Limitations

- **Thresholds are provisional.** Defaults were authored from documentation and have
  never been calibrated against a real account. `/tk:direction` shows that confidence
  rather than hiding it.
- **Rules are instructions, not enforcement.** Nothing blocks a violation at runtime.
  CI gates enforce the *artifacts* — that templates demand citations, that thresholds
  carry provenance, that vendor names stay confined — not the model's behavior.
- **Query budget can be overrun.** Metered vendors bill per query and a free tier is
  small. Set `budget.maxQueriesPerRun` in `.tk.json` to match your plan.

## Development

```bash
npm run manifest   # regenerate release-manifest.json after payload changes
npm run check      # run all 9 quality gates
```

Contributor rules: `docs/kit-contract.md`.

## License

MIT
