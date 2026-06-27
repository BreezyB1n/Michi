# Doc Append Merge Guard Decision

## Decision

Configure Git's `union` merge driver for the docs files that are intentionally append-only coordination ledgers:

- `docs/design-docs/index.md`
- `docs/product-specs/index.md`
- `docs/exec-plans/status.md`

## Context

Michi uses small frontend slices and one branch per slice. Many slices need to append a product spec, a design decision, or a completed milestone row. These additions are independent, but they land at the same location in shared Markdown files, so Git reports conflicts even when both sides should be preserved.

## Rationale

- `merge=union` matches the intended append-only behavior: keep both additions instead of forcing a manual conflict for every queued PR.
- The configuration is narrow. It does not affect arbitrary documentation or source files.
- A real-git regression test is stronger than only checking `.gitattributes` text because it proves the merge behavior that future PRs depend on.
- The guard reduces queue friction without hiding semantic conflicts in implementation code.

## Consequences

- Append-only docs conflicts become less frequent when this branch is merged before other queued docs-updating PRs.
- Reviewers still need to check ordering, duplicate rows, and stale wording in these docs because union merge can preserve both sides even if the wording should be consolidated.
- Non-append edits to these guarded files should remain rare and intentional.

## Rollback

Remove `.gitattributes`, the regression test, and this spec/decision documentation. Existing application and extension behavior would be unchanged.
