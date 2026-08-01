'use strict';

/**
 * Vendor registry for the connection wizard.
 *
 * This is the one place in the CLI that knows vendor names. The payload keeps its own
 * vendor boundary under claude/skills/_shared/tiktok/ (enforced by check-vendor-leak),
 * so adding a vendor touches three files total: this one, mcp-tool-matrix.md, and
 * connection-setup.md. Keep it that way — scattering vendor knowledge further is what
 * makes the official-MCP swap expensive later.
 */

const VENDORS = [
  {
    id: 'official-ads',
    label: 'Ads — TikTok official  (recommended)',
    summary: 'Straight to TikTok. No developer app, no approval wait, nobody in the middle.',
    caveat: 'Ads only — no organic data. Authorization expires after 30 days. Exposes write tools; this kit stays read-only by instruction, not by capability.',
    planes: ['ads'],
    vendor: 'tiktok-official',
    server: 'tiktok-ads',
    suggestedBudget: 20,
    prompts: [
      {
        key: '__variant',
        label: 'Tool surface',
        select: [
          { value: 'flat', label: 'Full — ~400 tools loaded at connect (TikTok recommends this for Claude)' },
          { value: 'layer', label: 'Layered — ~40 core tools, rest discovered on demand (lighter context)' },
        ],
        default: 'flat',
      },
    ],
    // Claude Code needs "type" alongside "url" for remote servers; a bare {url} entry
    // is not enough. TikTok's own docs show the generic MCP shape, not this one.
    build: (answers) => ({
      type: 'http',
      url: `https://business-api.tiktok.com/open_mcp/tt-ads-mcp-${answers.__variant || 'flat'}`,
    }),
    setupUrl: 'https://business-api.tiktok.com/portal/docs/how-to-connect-to-tiktok-for-business-mcp-server/v1.3',
    postNote: 'Your agent will prompt you to sign in and authorize on first connect. Re-authorize every 30 days.',
  },
  {
    id: 'hosted-both',
    label: 'Ads + Organic — hosted vendor',
    summary: 'The only route to organic data. One connection covers both planes, free tier available.',
    caveat: 'A third party holds your TikTok OAuth token and your data passes through them.',
    planes: ['ads', 'organic'],
    vendor: 'detrics',
    server: 'detrics',
    suggestedBudget: 6,
    prompts: [
      { key: 'DETRICS_API_KEY', label: 'Detrics API key (app.detrics.io → MCP)', secret: true },
    ],
    build: (answers) => ({
      command: 'npx',
      args: ['-y', 'detrics'],
      env: { DETRICS_API_KEY: answers.DETRICS_API_KEY },
    }),
    setupUrl: 'https://app.detrics.io',
  },
  {
    id: 'self-hosted-ads',
    label: 'Ads only — self-hosted',
    summary: 'Tokens stay on your machine. Adds wasted-spend audit and pixel health.',
    caveat: 'Needs Python 3.10+, uv, and a TikTok developer app that TikTok must approve first.',
    planes: ['ads'],
    vendor: 'adsmcp',
    server: 'tiktok-ads',
    suggestedBudget: 20,
    prompts: [
      { key: '__dir', label: 'Path to your local tiktok-ads-mcp-server clone', secret: false, path: true },
      { key: 'TIKTOK_APP_ID', label: 'TikTok app ID', secret: false },
      { key: 'TIKTOK_APP_SECRET', label: 'TikTok app secret', secret: true },
    ],
    build: (answers) => ({
      command: 'uv',
      args: ['--directory', answers.__dir, 'run', 'python', 'run_server.py'],
      env: {
        TIKTOK_APP_ID: answers.TIKTOK_APP_ID,
        TIKTOK_APP_SECRET: answers.TIKTOK_APP_SECRET,
      },
    }),
    setupUrl: 'https://github.com/AdsMCP/tiktok-ads-mcp-server',
  },
  {
    id: 'external-content',
    label: 'Content plane — optional',
    summary: 'On-platform search and transcripts for the Outside half of research.',
    caveat: 'Needs a third-party API key. Skip this if you only want account analysis.',
    planes: ['external'],
    vendor: 'content-mcp',
    server: 'tiktok-content',
    suggestedBudget: null,
    prompts: [
      { key: '__entry', label: 'Path to the built tiktok-mcp entry (build/index.js)', secret: false, path: true },
      { key: 'TIKNEURON_MCP_API_KEY', label: 'TikNeuron API key', secret: true },
    ],
    build: (answers) => ({
      command: 'node',
      args: [answers.__entry],
      env: { TIKNEURON_MCP_API_KEY: answers.TIKNEURON_MCP_API_KEY },
    }),
    setupUrl: 'https://github.com/seym0n/tiktok-mcp',
  },
];

const byId = (id) => VENDORS.find((v) => v.id === id) || null;

/** The zero-question default. Everything else is opt-in via `tk connect --advanced`. */
const DEFAULT_VENDOR_ID = 'official-ads';

module.exports = { VENDORS, byId, DEFAULT_VENDOR_ID };
