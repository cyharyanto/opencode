# Task resume ownership

## Summary

**Context:** The task tool can create subagent sessions and can resume a previous task by task ID.

**Problem:** When a task ID is supplied, the runtime loads that session and reuses it without checking that the session belongs to the current parent session or the requested subagent.

**Impact:** A task call can continue an unrelated child session and mix that older context or output into the current conversation.

**Recommendation:** Validate ownership before resuming any task session.

## Evidence

- `packages/opencode/src/tool/task.ts` loads `params.task_id` directly when present.
- New task sessions are created with the current session as `parentID`, but the resume path does not verify the stored `parentID`.
- The resume path also does not verify that the existing task session matches the requested subagent type.

## Recommended Plan

1. When `task_id` is present, load the existing session and require its `parentID` to equal the current session ID.
2. Persist or infer the subagent identity for task sessions and require it to match `subagent_type` on resume.
3. Return a clear tool error when the task cannot be resumed, with guidance to start a new task instead of silently reusing unrelated context.
4. Add tests for valid resume, wrong-parent rejection, missing-task fallback, and wrong-agent rejection.

## Acceptance Criteria

- [ ] Resuming a task from its original parent still works.
- [ ] A task ID from another parent session is rejected.
- [ ] A task ID for a different subagent type is rejected or safely starts a new task only when explicitly designed.
- [ ] The issue is linked to this PR.
