# Task Resume Boundary

## Summary

**Context:** The task tool can start a subagent session and later resume it with a `task_id`.

**Problem:** A supplied `task_id` is reused when it resolves to an existing session, without first checking that the child belongs to the current parent session or that it was created for the requested subagent type.

**Impact:** A stale or wrong task ID can attach new work to the wrong child session, mix task histories, and reuse permission state inherited from a different parent task.

**Recommendation:** Treat `task_id` as a scoped child-session handle and reject mismatches before prompting the resumed session.

## Evidence

- The task tool loads `task_id` from storage and reuses the session when found.
- The resumed session is prompted as the requested subagent after reuse is selected.
- New child sessions already store the current session as `parentID`, so the parent relationship is available for validation.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Require resumed sessions to have `parentID` equal to the current session and reject all mismatches. | Simple, prevents accidental cross-session reuse. | Existing task IDs from older flows may stop resuming outside their original parent. |
| B | Require parent match and persist the original subagent type in child-session metadata for exact subagent validation. | Strongest boundary and clearest errors. | Needs a small storage/schema or metadata decision if no existing field is suitable. |
| C | Allow parent mismatch only when the user explicitly supplied the task ID through a trusted UI action. | Preserves more flexibility. | More complex and weaker for model-initiated tool calls. |

## Recommended Plan

1. Implement Option A first: before reusing an existing task session, check that its parent session matches the caller.
2. Add a follow-up metadata field or reuse an existing durable field to record the child subagent type, then reject task resumes where the requested subagent differs.
3. Return a clear tool error that tells the agent to start a new task when the ID is stale, mismatched, or belongs to another parent.
4. Add regression coverage for parent mismatch and subagent mismatch once the durable subagent field is chosen.

## Acceptance Criteria

- [ ] A task ID from another parent session cannot be resumed by the current session.
- [ ] A task ID created for one subagent cannot be resumed as a different subagent.
- [ ] Mismatches return a recoverable tool error instead of silently injecting work.
- [ ] Existing valid task resumption still works.
