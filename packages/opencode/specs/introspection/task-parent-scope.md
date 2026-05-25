# Scope task IDs to their parent session

## Summary

**Context:** Task and task_status let the agent continue or inspect delegated subagent sessions using task IDs returned by the task tool.

**Problem:** The task ID is treated as sufficient authority. If the ID maps to any existing session, task resume/status can use it without checking that the task session belongs to the current parent session.

**Impact:** A stale transcript, injected instruction, or copied task ID can make the agent read or continue the wrong task session.

**Recommendation:** Require task sessions to be children of the current session before resume or status access, and return a clear error when the task ID is unknown for that parent.

## Evidence

- The task tool loads a provided task_id and reuses the session when it exists.
- The status tool can inspect an existing task session and return its latest assistant output.
- Neither path validates that the requested task session's parent matches the current session.

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Check `session.parentID === ctx.sessionID` for task resume and task_status. | Clear ownership rule; smallest safe fix. | Parent sessions cannot intentionally inspect sibling or older task IDs. |
| B | Store an explicit parent/task ownership record and validate against it. | More flexible for future task sharing. | Larger state migration and more moving parts. |
| C | Allow cross-parent access only with an explicit permission prompt. | Supports power-user workflows. | Harder for users to reason about and still risks data disclosure. |

## Recommended Plan

1. Implement Option A for both task resume and task_status.
2. Ensure resumed existing sessions also match the requested subagent type or return a clear mismatch error.
3. Add tests for valid child resume/status, unknown task IDs, and existing sessions whose parent is different from the current session.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] task and task_status reject task IDs that are not children of the current session.
- [ ] Cross-session rejection does not reveal another session's output.
- [ ] Regression tests cover valid and invalid parent ownership cases.
