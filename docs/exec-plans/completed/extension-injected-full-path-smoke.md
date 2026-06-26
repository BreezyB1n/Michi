# Extension Injected Full Path Smoke Execution Plan

## Goal

Expand Michi's unpacked-extension smoke so the injected shell is verified against the full Cloudflare Workers guide path: overview, starter editor, deploy review, deploy result completion, and missing-target recovery.

## Scope

- Product spec: `docs/product-specs/extension-injected-full-path-smoke.md`
- Decision record: `docs/design-docs/extension-injected-full-path-smoke-decision.md`
- Browser smoke: `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No real Cloudflare writes, DNS writes, deployment, account mutation, or automatic page navigation.
- No production Chrome Web Store packaging.
- No new permissions, browser storage, backend service, or LLM runtime.
- No broad UI redesign or React content-script migration.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing browser smoke assertions for starter editor and deploy review anchoring.
- [x] Expand the Cloudflare fixture pages to satisfy the full path smoke.
- [x] Run focused e2e, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium` | Pass | RED first failed because the starter-editor fixture returned overview DOM; after adding starter-editor and deploy-review fixture bodies, 1 Chromium extension smoke passed. | Uses bundled local Node runtime path. |
| `npm test` | Pass | 7 test files passed, 39 tests passed. | Uses bundled local Node runtime path. |
| `npm run build` | Pass | `tsc -b && vite build` completed and emitted `dist/`. | Uses bundled local Node runtime path. |
| `npm run test:e2e` | Pass | Extension build completed; Playwright reported 3 passed, 1 skipped. Chromium unpacked-extension smoke covered overview, starter editor, deploy review, deploy result completion, and missing-target recovery. | Mobile extension-runtime smoke remains intentionally skipped by project config. |
| `git diff --check` | Pass | Exit 0 with no whitespace errors. | No output on success. |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` passed with 7 test files and 39 tests. | Base review before subagent findings. |
| Product/runtime subagent review | Pass | Explorer subagent reported no P0/P1 findings and two P2 doc-state issues; both were fixed by aligning the focused smoke command and final evidence rows. It verified `Check page` maps Step 2/3/4/5 and deploy review covers target highlight plus critical confirmation. | Read-only review; no file edits. |
| Security/permission subagent review | Pass | Explorer subagent reported no P0/P1/P2 findings. It verified no manifest permission expansion, storage, scripting, real external requests, host-page deploy click, DNS write, credentials, or PII. | Read-only review; no file edits. |
