# Parent-bound task resume and status

## Summary

**Context:** The task tool creates subagent sessions and can resume a prior task when given a task ID.

**Problem:** When a task ID already exists, the task tool reuses that session without validating that it belongs to the current parent task. The status tool also reads any existing task session by ID.

**Impact:** A known task ID from another task or prior context can bring unrelated context or permissions into the current parent session.

**Recommendation:** Bind task resume and status operations to the parent session and expected subagent identity.

## Evidence

- Existing task IDs are loaded and reused before the child-session creation path that derives parent restrictions: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/task.ts#L144-L169
- Status reads job or latest assistant output for any existing task session ID: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/task_status.ts#L118-L152
- New child sessions already record `parentID`, which can be used as the ownership check: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/task.ts#L152-L169

## Implementation Plan

1. On task resume, load the existing session and require `parentID === ctx.sessionID`.
2. Require the resumed task session to match the requested subagent identity, or store enough task metadata to validate it.
3. On task status, require the target session to be a child of the current session unless status is being read from a trusted non-agent UI/API path.
4. Return a clear tool error when a task ID is unknown, not a child, or belongs to a different subagent.
5. Add regression tests for mismatched parent IDs, mismatched subagent type, and valid child resume/status.

## Acceptance Criteria

- [ ] A task can resume only a child task created by the current parent session.
- [ ] Task status cannot read unrelated session output from the model-facing tool path.
- [ ] Parent-derived permission restrictions cannot be bypassed by supplying an existing unrelated session ID.
