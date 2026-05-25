# Task Resume Permission Boundary

## Summary

The task tool should only resume task sessions that belong to the current parent session or an explicitly allowed lineage. When a task is resumed, the effective permissions should be refreshed against the current parent before the subagent receives another prompt.

## Current behavior

- A supplied `task_id` is looked up directly.
- If it exists, that session is reused without checking that it is a child of the current parent session.
- The permission derivation used for newly created task sessions is skipped on the resume path.

## Recommended fix

Implement the safe-resume path in this order:

1. Load the requested task session.
2. Reject it unless it is owned by the current parent session, or by a deliberately supported descendant lineage.
3. Recompute the current parent ceilings before prompting the subagent.
4. Preserve deny rules and external-directory ceilings from the current parent even when the resumed task was created under a more permissive mode.
5. Return a clear tool error when the task ID is unknown, belongs to another parent, or cannot safely inherit the current parent restrictions.

## Tests to add

- Resuming a child of the current session still works.
- Resuming a task session from a different parent fails.
- Resuming a task created under build mode from plan mode cannot regain edit/write/apply-patch authority.
- Background task polling still works for the valid same-parent path.

## Open question

If cross-session task resume is a supported product feature, define the exact ownership rule before implementation. The safest default is same-parent only.
