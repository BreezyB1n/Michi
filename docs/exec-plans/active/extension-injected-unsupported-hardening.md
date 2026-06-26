# Extension Injected Unsupported Hardening Execution Plan

## Goal

Harden Michi's injected extension shell for unsupported Cloudflare dashboard areas so unsupported pages show recovery guidance instead of being mistaken for a Workers guide step.

## Scope

- Product spec: `docs/product-specs/extension-injected-unsupported-hardening.md`
- Decision record: `docs/design-docs/extension-injected-unsupported-hardening-decision.md`
- Page reader: `src/extension/cloudflarePageReader.ts`
- Browser smoke: `tests/e2e/extension-runtime.spec.ts`
- Unit tests: `tests/cloudflarePageReader.test.ts`, `tests/injectedShell.test.ts`
- Evidence ledger: this file

## Non-goals

- No real Cloudflare writes, DNS writes, deployment, account mutation, or automatic page navigation.
- No production Chrome Web Store packaging.
- No new permissions, browser storage, backend service, or LLM runtime.
- No broad UI redesign or React content-script migration.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing unit and browser smoke assertions for unsupported Cloudflare dashboard areas.
- [x] Implement unsupported Cloudflare area detection and recovery copy alignment.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/cloudflarePageReader.test.ts tests/injectedShell.test.ts` | Pass | 2 files, 17 tests passed after adding normal-nav unsupported fixture and stale confirm/completion recovery coverage. | Initial RED covered analytics misclassified as `cloudflare.dashboard.home`; product review later exposed the normal-nav fixture gap, which is now covered. |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium` | Pass | Extension bundle built; Chromium unpacked-extension smoke passed 1 test. | E2E fixture now keeps normal Cloudflare nav on analytics and scopes `Workers & Pages` assertion to the Michi panel. |
| `npm test` | Pass | 7 files, 42 tests passed. | Local Vitest/JSDOM coverage only; real Cloudflare DOM remains simulated. |
| `npm run build` | Pass | `tsc -b && vite build` completed successfully. |  |
| `npm run test:e2e` | Pass | Full Playwright suite: 3 passed, 1 skipped. | Extension runtime smoke is skipped on the mobile project by design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` ran Vitest: 7 files, 42 tests passed. | Script currently maps to unit tests; browser smoke is tracked separately above. |
| Product/runtime subagent review | Pass | Initial review found normal-nav misclassification and stale phase masking; both were fixed and follow-up review returned pass. | No code edits from subagent. |
| Security/permission subagent review | Pass | No blocking findings; manifest remains `activeTab` with `https://dash.cloudflare.com/*`, no storage/fetch/scripting expansion found. | Reviewer noted there is no static permission-regression test yet. |
