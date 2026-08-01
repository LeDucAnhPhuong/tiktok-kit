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
    id: 'hosted-both',
    label: 'Ads + Organic — hosted',
    summary: 'One connection covers both planes. ~15 minutes, free tier available.',
    caveat: 'A third party holds your TikTok OAuth token.',
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

module.exports = { VENDORS, byId };
