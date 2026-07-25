# @finografic/ai-agent-config

> Single source of truth for agent-facing instructions, skills, and hooks, synced across the @finografic ecosystem.

## Installation

```bash
pnpm add @finografic/ai-agent-config
```

## Usage

```typescript
import { agentAssets, assetsRoot } from '@finografic/ai-agent-config';

// agentAssets: typed manifest of vendored agent-facing files (config, instructions, skills)
// assetsRoot: absolute path to this package's assets/ directory, for reading raw file contents
for (const asset of agentAssets) {
  // target is string | string[] — skills dual-write to .agents/skills (cross-tool manual
  // reference) and .claude/skills (native Claude Code discovery) from the same source
  const targets = Array.isArray(asset.target) ? asset.target : [asset.target];
  for (const target of targets) {
    console.log(asset.kind, asset.source, '->', target);
  }
}
```

This package ships the raw asset files plus a typed manifest describing where each lands in a
consumer repo. Instructions and skills land under `.agents/` (skills also dual-write to
`.claude/skills/`); `copilot-instructions.md` stays under `.github/` since that's the only place
Copilot itself reads from. This package does not contain any copy/apply/vendoring logic — that
pipeline lives in [`@finografic/genx`](https://github.com/finografic/genx) (`genx managed audit`).

## Development

```bash
# Install dependencies (automatically sets up git hooks)
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

**Note:** Git hooks are automatically configured on `pnpm install`. See [docs/process/DEVELOPER_WORKFLOW.md](./docs/process/DEVELOPER_WORKFLOW.md) for the complete workflow.

## License

MIT © Justin Rankin
