# Extension Injected Critical Confirmation Decision

## Decision

Model critical-action confirmation as a local injected-shell phase that gates guide-step preview navigation.

## Context

The local web app already requires confirmation before simulated Cloudflare write actions. The injected shell can start a guide session and browse Workers steps, but it can currently preview the next step without acknowledging critical actions such as `Create Worker`.

## Rationale

- Confirmation is central to Michi's guide-agent safety model.
- Keeping confirmation local avoids pretending that the extension executed a Cloudflare write.
- Reusing the guide step's `criticalAction` copy keeps the extension shell aligned with the local web app.
- This slice stays small enough to review before deciding whether the extension shell should adopt the full React Guide UI.

## Consequences

- `src/extension/injectedShell.ts` gets a local `confirm` phase.
- `Next step` enters `confirm` when the active guide step has a critical action.
- `Confirm action` advances the local guide preview to the next step.
- No host-page event is dispatched by confirmation.

## Rollback

Remove the local confirmation phase and restore `Next step` to increment `activeStepIndex`. Session start, guide navigation, page check, target highlight, and recovery guidance remain intact.
