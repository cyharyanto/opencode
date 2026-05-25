# Read-only roles and shell mutation

## Summary

**Context:** Plan mode and explore subagents are meant to let users inspect or plan without workspace edits.

**Problem:** Those roles still have shell access that can mutate files inside the workspace without the edit/write/patch approval path.

**Impact:** A planning or exploration task can change or delete files even when the user chose a role that appears read-only.

**Recommendation:** Treat shell mutation as write authority for read-only roles. I recommend a constrained shell profile for those roles, with mutating commands routed through the same approval boundary as edits.

## Evidence

- Agent permissions define plan as edit-denied while inheriting default shell authority.
- Explore explicitly allows shell even though its prompt says not to modify the system.
- The shell tool asks for command-pattern permission, but in-worktree writes are not converted into edit-style diff approval.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Remove shell from plan and explore by default. | Smallest boundary, easy to reason about. | Loses harmless commands like ls, pwd, and git status. |
| B | Add a read-only shell profile for plan/explore. | Preserves useful inspection commands. | Needs careful command classification. |
| C | Detect shell writes and route them through edit approval. | Most flexible. | Harder to make complete for scripts and redirects. |

## Recommended Plan

1. Start with option B for plan/explore and deny unknown or mutating commands.
2. Keep normal shell behavior for build/general agents.
3. Add tests showing plan and explore cannot write, delete, or redirect into workspace files through shell.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Plan and explore cannot mutate workspace files through shell without an explicit write boundary.
- [ ] Existing build-agent shell behavior is preserved.
