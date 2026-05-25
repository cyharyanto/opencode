# Preserve parent permissions for subagent prompts

## Summary

**Context:** Plan mode and parent session permissions are supposed to constrain delegated subagents so planning stays read-only and external-directory rules continue to apply.

**Problem:** A child session is created with derived parent permissions, but the first subagent prompt can replace that session permission list with only the deprecated tool override rules passed by the task tool.

**Impact:** A general or custom subagent launched from a planning session can lose inherited edit and external-directory restrictions before it runs.

**Recommendation:** Merge tool-derived overrides into the existing child session permissions instead of replacing them, and cover the real task-to-prompt path with a regression test.

## Evidence

- The task tool creates a child session with permissions from the parent agent and parent session.
- The task tool then calls the prompt service with a tool override map for task-local tool disabling.
- The prompt service converts that map to a fresh permission list and persists it as the whole session permission set.

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Change prompt handling so tool-derived rules are appended to the existing session permissions. | Smallest behavioral change; preserves existing task tool call sites. | Keeps the deprecated tools shim alive. |
| B | Change the task tool to pass explicit permission deltas through the session update API before prompting. | Makes permission mutation clearer at the caller. | More call-site-specific and still needs prompt shim safety for other callers. |
| C | Remove the deprecated tools field from internal task prompting and pass all permission shaping at session creation. | Cleans up the compatibility path. | Larger migration surface for SDK/API compatibility. |

## Recommended Plan

1. Implement Option A for the compatibility shim: when prompt input includes tool overrides, merge the generated rules after the current session permissions instead of replacing the whole list.
2. Add a regression test that creates or simulates a plan-mode parent, spawns a general/custom subagent through the task path, and verifies edit remains denied after the first subagent prompt.
3. Include an external-directory deny case so parent session denials are not lost either.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] The first subagent prompt preserves inherited parent agent and parent session restrictions.
- [ ] Tool overrides still deny task-local tools such as task and todowrite where intended.
- [ ] Regression tests cover the TaskTool to SessionPrompt path, not only the helper that derives initial permissions.
