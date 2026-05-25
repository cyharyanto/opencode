# Scoped task resume authority

## Summary

**Context:** Delegated task sessions let the coding agent split work across subagents and later continue the same task with a returned task ID.

**Problem:** A provided task ID is loaded directly and reused without confirming that the session belongs to the current parent, matches the requested subagent, or still satisfies the current parent permission ceiling.

**Impact:** A restricted parent session can continue a delegated session that was created with broader authority, or mix unrelated task context into the current run.

**Recommendation:** Bind task resumption to the current parent/session boundary and refresh the inherited authority before prompting the resumed subagent.

## Evidence

- The task tool loads a provided task ID and uses that session when found: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/task.ts#L144-L153).
- The new-session path, which sets the current parent ID and derives permission ceilings, only runs when no existing session is found: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/task.ts#L152-L169).

## What I Found

The create path has the right ownership and permission ingredients, but the resume path bypasses them. That makes task IDs act like ambient capabilities rather than parent-scoped continuation handles.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Reject resume unless the task session parent ID matches the current session and its agent matches the requested subagent. | Smallest safe boundary; easy to test. | Existing cross-session resume workflows would need an explicit migration or error message. |
| B | Allow cross-parent resume only through an explicit user-approved handoff operation. | Preserves advanced workflows. | Larger product/API decision and more UI surface. |
| C | Recreate a child session on mismatch and copy only the final task summary. | Avoids hard failure. | Risky because copied context may still carry stale assumptions. |

## Recommended Plan

1. Implement Option A first: validate parent ID and subagent identity before reusing a task session.
2. Recompute or append current parent permission ceilings before prompting any resumed task.
3. Return a clear tool error when a task ID is not resumable from the current parent.
4. Add regression coverage for plan/restricted mode resuming a task created under broader authority.

## Acceptance Criteria

- [ ] The linked issue is attached to this PR.
- [ ] Resumed task sessions are parent-scoped by default.
- [ ] Current parent permission ceilings apply after resume.
- [ ] Tests cover allowed same-parent resume and rejected stale/cross-parent resume.
