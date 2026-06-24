# Michi Web UI MVP Product Spec

## Summary

Michi's first milestone is a local web UI that demonstrates a Guide Agent flow for the Cloudflare Workers primary demo path.

The user starts with:

> I want to build a small service that other people can access.

Michi should clarify the service type if needed, explain why Cloudflare Workers is the right Capability for backend logic or an API, generate a Guide Path, and guide the user through simulated page states until the Worker URL completion check passes.

## Goals

- Prove the Guide Loop in a browser UI.
- Show intent-to-capability mapping without requiring the user to know Cloudflare product names.
- Display Guide Steps with Step Purpose and Completion Check.
- Simulate Runtime Page Understanding before building a real extension.
- Show Critical Write Action confirmation before simulated resource creation or deployment.
- Show at least one Recovery Step for a Blocking State.
- End the primary path by recommending DNS binding as a Follow-up Capability Route.

## Non-Goals

- Do not build a real browser extension in this milestone.
- Do not execute actions against a real Cloudflare account.
- Do not support every Cloudflare service.
- Do not require DNS binding to complete the primary path.
- Do not introduce multi-agent orchestration.

## Primary User Flow

1. User opens the Michi web UI.
2. User enters a natural-language intent.
3. Michi asks the smallest necessary clarification: backend logic/API or static website.
4. User chooses backend logic/API.
5. Michi explains Workers as the Cloudflare Compute Capability.
6. Michi generates a Guide Path for creating and deploying a Worker.
7. Michi shows the current simulated Cloudflare page state.
8. Michi highlights the next action in the local UI.
9. User advances the step or confirms a Critical Write Action.
10. Michi runs a Completion Check.
11. If blocked, Michi shows a Recovery Step.
12. When the Worker URL check passes, Michi summarizes the learned Capability and recommends DNS binding as a follow-up route.

## Required MVP Screens

### Intent Entry

Captures the user's User Intent and starts the Guide Loop.

### Clarification

Asks only path-changing questions. For the MVP, the required clarification is whether the user wants backend logic/API or a static website.

### Guide Workspace

Shows:

- selected Capability
- Guide Path progress
- current Guide Step
- Step Purpose
- Completion Check
- simulated page state
- available assistance actions

### Confirmation

Before simulated creation or deployment, Michi must explain the impact and require user confirmation.

### Recovery

Shows what blocked the step, why it blocks the user's goal, and how the user can proceed.

### Completion

Shows that the Worker URL is reachable in the simulated environment and recommends DNS binding as the Follow-up Capability Route.

## Data Concepts

### User Intent

The user's goal in their own words.

### Capability

A product ability that satisfies the intent. The MVP uses Cloudflare Workers as the primary Capability.

### Guide Path

An ordered route from User Intent to a concrete outcome.

### Guide Step

A step with action, purpose, completion check, and optional assistance.

### Page State

The current simulated website state used to decide whether the next step can proceed.

### Blocking State

A page, account, permission, or validation condition that blocks progress.

### Recovery Step

The next user-facing step produced because a Blocking State prevents normal progress.

## Acceptance Criteria

- The UI can start from the sample User Intent and reach a completion screen.
- The UI can show why Workers is selected for backend logic/API.
- Every Guide Step shown in the UI includes action, purpose, and completion check.
- At least one step requires Critical Write Action confirmation.
- At least one simulated Blocking State produces a Recovery Step.
- The final screen recommends DNS binding as a follow-up route.
- The implementation does not depend on live Cloudflare credentials.
