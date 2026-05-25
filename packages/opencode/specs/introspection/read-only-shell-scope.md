# Constrain shell use in read-only roles

## Summary

**Context:** Plan mode asks the agent to research and prepare a plan without changing the workspace, and it uses exploration subagents for read-only discovery.

**Problem:** Read-only behavior is currently a prompt contract plus edit-tool denial, but exploration roles can still receive broad shell authority. A broad shell allow can approve mutating commands without a separate read-only check.

**Impact:** A planning or exploration subagent can change files, configs, or repository state through shell even though the user selected a planning-only workflow.

**Recommendation:** Add an enforced read-only shell boundary for plan/explore contexts, or require explicit review for commands that can mutate workspace or VCS state.

## Evidence

- Plan mode tells the agent to take only read-only actions outside the plan file.
- Explore is intended for codebase discovery and explicitly allows shell access.
- The shell tool checks command patterns through the normal permission system, so a broad bash allow rule can approve mutating commands.

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Introduce a read-only shell mode for plan/explore that allowlists inspection commands and denies common mutation commands. | Strong deterministic boundary for the read-only promise. | Requires maintaining command classification across shells. |
| B | Keep shell available but make plan/explore ask for every nontrivial shell command. | Safer with low implementation complexity. | More permission prompts for common exploration tasks. |
| C | Remove shell from explore and rely on grep, glob, read, web, and repo tools. | Simplest guarantee for exploration subagents. | Some useful discovery commands become unavailable. |

## Recommended Plan

1. Decide whether plan/explore needs shell by default; if yes, implement Option A or B rather than broad allow.
2. Treat file writes, deletes, chmod/chown, package installs, git mutations, redirects, and command chains with unknown side effects as review-required or denied in read-only contexts.
3. Add regression tests showing that plan/explore can inspect code but cannot mutate workspace files through shell without review.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Plan/explore roles have a deterministic runtime boundary for shell mutations.
- [ ] Inspection commands remain usable enough for codebase research.
- [ ] Tests cover allowed read-only commands and denied or review-required mutating commands.
