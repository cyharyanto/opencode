# Enforce task resume ownership

## Summary

Task resume should only continue a delegated child session that belongs to the current parent and requested subagent. Today the task tool accepts any existing session ID, which can mix unrelated state or reuse permissions created under a different parent.

## Evidence

- The resume path loads an existing task_id directly.
- Parent-scoped permission derivation runs only when creating a new child session.
- The current positive test covers same-parent resume, but there is no rejection test for a foreign session.

## Changes

- Add a resume guard before reusing an existing task session.
- Require the existing session's parent to match the current session.
- Require the existing session's agent, when set, to match the requested subagent.
- Add regression tests for rejecting a task_id from another parent and a mismatched subagent.

## Verification

- Run the task tool test file.
- Confirm valid same-parent resume still works.
- Confirm foreign sessions create a clear error instead of being reused.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Resume cannot cross parent-session boundaries.
- [ ] Resume cannot silently reuse a different subagent's state.
