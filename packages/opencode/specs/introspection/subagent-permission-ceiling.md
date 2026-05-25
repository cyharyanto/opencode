# Subagent Permission Ceiling

## Summary

**Context:** Subagents inherit authority from the parent session when the task tool creates a child session.

**Problem:** The child session is created with inherited denies, but the next prompt call can replace that permission set with only per-call tool toggles.

**Impact:** A restricted parent mode can delegate work to a child run that no longer carries the intended hard limits.

**Recommendation:** Preserve inherited session ceilings when applying per-call tool toggles, and add a regression test for the full task-tool-to-prompt path.

## Evidence

- `packages/opencode/src/tool/task.ts` creates the child session with `deriveSubagentSessionPermission(...)`.
- `packages/opencode/src/tool/task.ts` then calls the prompt path with `tools` toggles for child execution.
- `packages/opencode/src/session/prompt.ts` rebuilds `session.permission` from `input.tools` and writes that shorter ruleset back to the session.

Linked Introspection issue: /issues/I-1.

## What I Found

The helper-level tests cover the derived permission ruleset, but they do not exercise the later prompt call that mutates the child session. In the live path, any non-empty `tools` object causes the prompt service to overwrite the session permissions, so previously derived denies and external-directory rules can be lost.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Merge per-call tool toggles into the existing session permission set instead of replacing it. | Minimal change; keeps inherited ceilings. | Needs care to avoid stale per-call toggles accumulating across resumed sessions. |
| B | Move task-specific tool disables into the child session creation payload and stop passing `tools` for subagent prompts. | Keeps authority setup in one place. | Requires checking every caller that relies on prompt-level `tools`. |
| C | Add an explicit immutable ceiling field separate from mutable per-call tool toggles. | Strongest long-term model. | Larger schema/API change. |

## Recommended Plan

1. Implement Option A or B after confirming the intended public semantics of `PromptInput.tools`.
2. Add a regression test that starts from a restricted parent, executes the task tool, lets the prompt path run, and asserts the child effective permissions still deny the inherited action.
3. Include a custom subagent case as well as the built-in plan/general path so future changes cannot reintroduce the bypass through config-defined agents.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Inherited deny and external-directory rules survive subagent prompt execution.
- [ ] Per-call tool toggles still disable task/todowrite or primary tools as intended.
- [ ] Regression coverage exercises the live task-tool-to-prompt path, not only the helper.
