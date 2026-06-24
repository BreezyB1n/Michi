# Michi Web UI MVP Execution Plan

## Goal

Implement the local React + Vite + TypeScript web UI MVP described in `docs/product-specs/michi-web-ui-mvp.md`.

## Tasks

- [x] Scaffold React, Vite, TypeScript, Vitest, Testing Library, and Playwright.
- [x] Add deterministic Guide Agent Core domain types and state transitions.
- [x] Add Cloudflare Workers Site Skill Pack fixture.
- [x] Add unit tests for Guide Core behavior.
- [x] Add component tests for intent, clarification, guide workspace, confirmation, recovery, and completion.
- [x] Build the focused workbench UI with a step-state split.
- [x] Add Playwright smoke coverage for the Workers primary path.
- [x] Verify build, unit tests, component tests, e2e tests, and desktop/mobile screenshots.

## Verification Commands

```bash
npm test
npm run build
npm run test:e2e
```
