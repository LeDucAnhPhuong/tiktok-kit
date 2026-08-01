# TikTok Kit (`tk`)

A Claude Code kit that reads your TikTok **ads and organic** data over MCP, works out
what is actually happening in the account, and produces a prioritized growth direction.

**Read-only.** The kit never writes to TikTok. It analyzes and recommends; you execute
in Ads Manager.

## Install

```bash
npm install -g tiktok-kit
tk init          # into ./.claude for this project
tk init -g       # into ~/.claude for every project
```

Then in Claude Code:

```
/tk:connect
```

Works standalone. If ClaudeKit is installed, `tk init` registers itself in `.ck.json`
so the two kits do not overwrite each other's settings.

## Commands

| Command | Does |
|---|---|
| `tk init [-g]` | install kit assets, register the kit, create `.tk.json` |
| `tk status` | install mode, payload version, connected data planes, query budget |
| `tk remove [-g]` | remove assets and unregister |

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

`/tk:connect` walks you through it and states the trade-off before you authorize
anything. In short:

- **Hosted vendor** — covers ads and organic, ~15 minutes, free tier available. **A
  third party holds your TikTok OAuth token.**
- **Self-hosted** — no third party holds tokens, but ads-only and requires a TikTok
  developer app that TikTok must approve first.

The kit never asks for or stores credentials. `.tk.json` records connection *state*
only.

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
