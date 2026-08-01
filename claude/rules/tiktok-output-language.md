# Output Language

Binding on every `tk:*` skill and every `tiktok-*` agent.

## The Setting

Read `locale.responseLanguage` from `.claude/.tk.json`:

| Value | Prose language |
|---|---|
| `vi` | Vietnamese (default) |
| `en` | English |

Absent or unreadable → Vietnamese.

## An Explicit Request Wins

If the user asks for a different language in the conversation — "trả lời tiếng Anh",
"in English", "English please" — follow that for the rest of the session. The config is
a default, not a lock.

Do not switch back on the next turn. Do not ask which language to use; read the config
and go.

## What Is Never Translated

This is the part that matters. Translating these breaks the user's ability to check
your work against TikTok's own interface, which is the whole point of citing them.

| Keep verbatim | Why |
|---|---|
| Metric names — `6-second view rate`, `complete view`, `CPA`, `ROAS`, `CTR` | must match TikTok Ads Manager exactly so the user can verify the number |
| Numeric values, currency codes, dates, percentages | data, not prose |
| Campaign, ad group, ad, and video names | they are identifiers on the platform |
| Tool names, config keys, file paths, `dataTrust` values, threshold keys | machine-facing strings |
| Status tokens — `DONE`, `BLOCKED`, `NEEDS_CONTEXT` | parsed by the orchestrating skill |
| Plane names — `ads`, `organic`, `external` | config vocabulary |

So a Vietnamese finding reads like:

> Ad group `Retarget_VN_03` tiêu 4.200.000 VND trong 28 ngày qua mà không có
> conversion nào. Ngưỡng `wasted_spend_floor` (provisional) là 2% chi tiêu tài khoản.

Metric name, entity name, threshold key, and number stay as they are. The explanation
around them is Vietnamese.

## Report Files

Section headings inside generated reports follow the same rule: prose translated,
structural labels kept. `Outside` / `Inside` / `Fit` stay as-is — they are the
contract `check-research-citations` verifies, and renaming them fails the gate.

## Confidence Labels

`provisional`, `measured`, `official`, `reported`, `speculative`, `trusted`,
`conversion-suspect`, `untrusted` — keep the token, explain it in prose if the user
seems unfamiliar. These are vocabulary the rest of the kit keys on.
