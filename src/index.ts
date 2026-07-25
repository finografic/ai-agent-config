import { fileURLToPath } from 'node:url';

/**
 * Category of a vendored agent asset, used by `genx managed audit` for
 * filtering (e.g. sync only instructions, or only skills).
 */
export type AgentAssetKind = 'config' | 'instruction' | 'skill' | 'hook';

export interface AgentAsset {
  /** Category, for audit filtering. */
  kind: AgentAssetKind;
  /** Path within this package's `assets/` dir. */
  source: string;
  /**
   * Destination(s) in the consumer repo, relative to its root. An array means
   * the same source is dual-written to multiple locations (e.g. skills land
   * at `.agents/skills` for cross-tool manual reference and `.claude/skills`
   * for native Claude Code discovery).
   */
  target: string | string[];
  /** When true, `source` is a directory whose tree is walked recursively. */
  recurse?: boolean;
}

/**
 * The canonical set of agent-facing assets vendored into each
 * `@finografic` project's `.agents/` directory (`.github/` for
 * Copilot-specific content, which only Copilot itself reads from there).
 */
export const agentAssets = [
  { kind: 'config', source: 'copilot-instructions.md', target: '.github/copilot-instructions.md' },
  { kind: 'instruction', source: 'instructions', target: '.agents/instructions', recurse: true },
  { kind: 'skill', source: 'skills', target: ['.agents/skills', '.claude/skills'], recurse: true },
] as const satisfies readonly AgentAsset[];

/**
 * Absolute path to this package's `assets/` directory on disk.
 * genx joins each asset's `source` onto this to read raw file contents.
 *
 * Resolves relative to the built entry at `dist/index.js`, so `../assets`
 * points at `<package-root>/assets`. If your tsdown output nests deeper
 * (e.g. `dist/src/index.js`), adjust the `../` depth accordingly.
 */
export const assetsRoot = fileURLToPath(new URL('../assets', import.meta.url));
