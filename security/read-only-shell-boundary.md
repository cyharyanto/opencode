# Read-only shell boundary

## Summary

**Context:** Plan mode tells users the agent is in a read-only phase and may only inspect the workspace.

**Problem:** The permission rules for plan and explore agents still leave shell execution available. Shell commands are parsed for prompts, but a broad bash allow means mutating commands can run even when the prompt says only read-only commands are allowed.

**Impact:** A user can choose planning mode and still have local files, git state, or generated artifacts changed if the model calls a side-effecting shell command.

**Recommendation:** Make the read-only boundary deterministic instead of prompt-only.

## Evidence

- `packages/opencode/src/session/prompt/plan.txt` forbids bash commands that modify files or system state.
- `packages/opencode/src/agent/agent.ts` adds edit denies for plan mode, but does not deny bash.
- The explore subagent explicitly allows bash, and plan-mode instructions encourage using explore agents for investigation.
- `packages/opencode/src/tool/shell.ts` asks for bash permission based on parsed commands, so a broad bash allow satisfies the check.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Deny bash for plan and explore agents by default. | Simple and safe. | Removes useful read-only shell commands such as test discovery and git status. |
| B | Add a read-only shell classifier for plan/explore mode and require approval or denial for mutating commands. | Preserves useful shell reads while enforcing the promise. | Needs careful command classification and escape handling. |
| C | Keep bash available but route all plan/explore shell calls through ask. | Safer than today and simple to reason about. | More user prompts and still relies on the user recognizing mutations. |

## Recommended Plan

1. Start with Option B if the shell parser can classify common mutation patterns reliably; otherwise choose Option C as the safer first change.
2. Treat redirects, file-changing commands, package installs, git writes, chmod/chown, and dynamic shell expansions as mutating unless proven read-only.
3. Add focused tests showing plan and explore agents cannot run a mutating shell command without deterministic denial or approval, while obvious read-only commands still work as intended.

## Acceptance Criteria

- [ ] Planning mode cannot perform shell side effects without a code-enforced decision.
- [ ] Explore subagents launched from planning mode inherit the same boundary.
- [ ] The issue is linked to this PR.
