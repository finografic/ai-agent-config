# Task: Populate `@finografic/ai-agent-config` from the canonical genx source

You are working at the root of the **`@finografic/ai-agent-config`** repo. This package is
the single source of truth for agent-facing instructions and skills, which `genx managed audit`
vendors into every `@finografic` project's `.github/` directory. The package ships the raw asset
files plus a typed manifest describing where each lands. It does **not** contain any copy/apply
logic — that pipeline lives in genx.

## Canonical source (read-only, on local disk)

```
/Users/justin/repos-finografic/@finografic-genx/.github/
```

Copy **only** these into this repo:

- `copilot-instructions.md`
- `instructions/` (recursively — includes nested `code/`, `documentation/`, `git/`, `naming/`, `project/`, and `README.md`)
- `skills/` (recursively — includes each skill's `SKILL.md`, plus non-markdown assets like `feature-template/*.template` and `.ts` files)

Do **NOT** copy:

- `workflows/` (`ci.yml`, `release.yml`) — that's project scaffolding, not agent content; it belongs to a different genx feature.
- Any `Icon\r`, `.DS_Store`, or similar OS cruft.

---

## Step 1 — Vendor the assets

Create an `assets/` directory that **mirrors the `.github/` structure** and copy the three sources in:

```bash
mkdir -p assets
cp    "/Users/justin/repos-finografic/@finografic-genx/.github/copilot-instructions.md" assets/
cp -R "/Users/justin/repos-finografic/@finografic-genx/.github/instructions"            assets/
cp -R "/Users/justin/repos-finografic/@finografic-genx/.github/skills"                  assets/
```

After copying, remove any stray non-content files that slipped in:

```bash
find assets -name '.DS_Store' -delete
find assets -name 'Icon?'      -delete 2>/dev/null || true
```

Resulting layout should be:

```
assets/
├── copilot-instructions.md
├── instructions/
│   ├── code/…
│   ├── documentation/…
│   ├── general.instructions.md
│   ├── git/…
│   ├── naming/…
│   ├── project/…
│   └── README.md
└── skills/
    ├── generate-new-genx-feature/…
    ├── maintain-agents/…
    ├── migrate-to-cli-kit/…
    ├── scaffold-cli-help/…
    ├── scaffold-core-module/…
    ├── scaffold-feature-preview/…
    ├── template-canonical-merge/…
    └── triage-docs/…
```

---

## Step 2 — Define the typed manifest and `assetsRoot`

Replace `src/index.ts` with the following. The manifest is **directory-group based** (not a
per-file enumeration) so genx expands and walks each entry — this keeps maintenance low and
makes adding future kinds (e.g. `hook`) a one-line change.

```ts
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
  /** Destination in the consumer repo, relative to its root. */
  target: string;
  /** When true, `source` is a directory whose tree is walked recursively. */
  recurse?: boolean;
}

/**
 * The canonical set of agent-facing assets vendored into each
 * `@finografic` project's `.github/` directory.
 */
export const agentAssets = [
  { kind: 'config',      source: 'copilot-instructions.md', target: '.github/copilot-instructions.md' },
  { kind: 'instruction', source: 'instructions',            target: '.github/instructions', recurse: true },
  { kind: 'skill',       source: 'skills',                  target: '.github/skills',       recurse: true },
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
```

---

## Step 3 — Wire `package.json`

Ensure these fields exist and are correct (merge into the existing file; keep the genx-generated
`name`, `version`, `scripts`, etc.):

```jsonc
{
  "type": "module",
  "files": [
    "dist",
    "assets"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./assets/*": "./assets/*",
    "./package.json": "./package.json"
  }
}
```

- `files` must include **both** `dist` (the manifest) **and** `assets` (the raw payload), or consumers get an empty package.
- `./assets/*` lets a consumer resolve an individual asset via subpath if ever needed; `assetsRoot` handles the bulk read.
- Do **not** add a copy/apply `bin` or script — vendoring logic stays in genx.

---

## Step 4 — Confirm the build carries assets, not bundles them

`tsdown` builds `src/index.ts` → `dist/`. The `.md`/`.template` files are **not** bundled; they
ship as-is via the `files` array. No tsdown config change should be needed. If tsdown is set to
clean `dist/` only, that's fine — leave `assets/` untouched by the build.

---

## Step 5 — Verify

```bash
pnpm build
node -e "import('./dist/index.js').then(m => { console.log(m.assetsRoot); console.log(JSON.stringify(m.agentAssets, null, 2)); })"
```

Then confirm the published payload would include the assets:

```bash
pnpm pack --dry-run 2>/dev/null | grep -E 'assets/|dist/' | head -40
```

## Acceptance criteria

- [ ] `assets/` mirrors `.github/` with `copilot-instructions.md`, `instructions/`, `skills/` copied recursively.
- [ ] `workflows/` and OS cruft were **not** copied.
- [ ] `src/index.ts` exports `agentAssets`, `assetsRoot`, `AgentAsset`, and `AgentAssetKind`.
- [ ] `package.json` `files` includes `dist` and `assets`; `exports` map is present.
- [ ] `pnpm build` succeeds and `assetsRoot` resolves to `<repo>/assets` at runtime.
- [ ] No copy/apply/vendoring logic was added to this package.

## Notes for the human (not tasks)

- **Managed vs. local drift:** once files are git-tracked in each consumer, an intentional local
  edit looks identical to drift. Decide the opt-in/opt-out mechanism (frontmatter `managed: true`,
  a per-project allowlist, or a `.genxignore`) on the **genx** side — it's out of scope for this package.
- **Reverse promotion:** promoting a good change from another project back to canonical writes into
  this repo's `assets/`. That's a genx `--detect-drift` concern, not something this package implements.
- **Skills stay here:** keep skills in this package (as `assets/skills/`), not a separate repo,
  unless they gain an independent consumer.
