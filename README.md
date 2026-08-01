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

`tk init` installs the kit, then walks you through connecting your TikTok data: pick a
vendor, paste your API key, and it writes `.mcp.json` for you. The key is read from a
muted terminal, so it never enters a Claude conversation.

Restart Claude Code, then verify the data actually flows:

```
/tk:connect
```

Works standalone. If ClaudeKit is installed, `tk init` registers itself in `.ck.json`
so the two kits do not overwrite each other's settings.

## Commands

| Command | Does |
|---|---|
| `tk init [-g]` | install kit assets, then run the connection wizard |
| `tk init --no-connect` | install only, skip the wizard |
| `tk connect` | configure or change MCP access — new vendor, rotated key |
| `tk status` | install mode, payload version, connected data planes, query budget |
| `tk remove [-g]` | remove assets and unregister |

The wizard is skipped automatically when there is no interactive terminal, so scripted
and CI installs never hang.

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

`tk connect` (also run by `tk init`) offers four options and states the trade-off
before you authorize anything:

| Option | Covers | Setup | Who holds your token |
|---|---|---|---|
| **TikTok official** — start here | ads | ~2 min, browser sign-in | TikTok. Nobody in the middle |
| Hosted vendor | ads + **organic** | ~15 min, API key | a third party |
| Self-hosted | ads | needs a TikTok developer app TikTok must approve | your machine |
| Content plane | external | optional, for research | third-party API |

The official server needs no developer app and no approval — it is a bare URL and a
browser sign-in. **Its authorization expires after 30 days**, which is the usual reason
an ads plane that worked last month has gone quiet.

It does not cover organic. A common pairing is official for ads plus a hosted vendor
for organic, so only the organic half passes through a third party.

### Where your key goes

The wizard writes it into `.mcp.json` in the project directory and adds that file to
`.gitignore`, because it is plaintext. If you are not in a git repo, it says so and
leaves the file for you to protect.

The key never passes through Claude: setup is a CLI job precisely so that it does not
land in a conversation transcript. `.tk.json` records connection *state* only — never
a token.

You need a TikTok account with real history for any of this to be useful. The kit
compares 28 days against the previous 28, so an account younger than about two months
produces noise, not insight.

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
