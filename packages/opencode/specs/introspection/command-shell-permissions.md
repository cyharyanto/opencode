# Slash-command shell permission plan

## Summary

**Context:** Slash commands can include shell interpolation so command templates can insert local command output into the prompt.

**Problem:** Interpolation currently runs before prompt creation through a direct process call, so it bypasses the shell tool permission flow and does not create a normal shell tool record.

**Impact:** A project command can execute hidden local shell commands as soon as a user invokes the slash command.

**Recommendation:** Route interpolation through a permissioned execution path before preserving the feature for project-sourced commands.

## Evidence

- Command templates are loaded from configured command directories, including project `.opencode/command` and `.opencode/commands` directories.
- Command handling expands interpolation matches with a direct process call before creating prompt parts.
- The current path does not use the shell tool's permission request or lifecycle record.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Execute interpolation through the same permission request used by shell actions, then substitute the captured output. | Keeps the feature and makes execution explicit to the user. | Needs a small shared helper so command execution can request permission without creating a misleading assistant tool call. |
| B | Disable shell interpolation for project-sourced commands unless a trusted config flag is set. | Simple hard boundary for untrusted repos. | Breaks existing project commands that intentionally use interpolation. |
| C | Leave interpolation direct but add a warning in command descriptions. | Low implementation effort. | Does not enforce the action boundary and keeps the hidden execution risk. |

## Recommended Plan

1. Implement option A for all command sources, with the permission request showing the command text and command name.
2. Keep the interpolation result substitution behavior unchanged after approval.
3. Add a regression test that a command template containing shell interpolation triggers the shell permission path before execution.
4. Consider option B only if product owners want a stricter trust boundary for project commands.

## Acceptance Criteria

- [ ] Shell interpolation cannot execute without passing through an explicit permission gate.
- [ ] Rejected interpolation prevents the command from running and reports a clear error.
- [ ] Accepted interpolation still substitutes command output into the prompt.
- [ ] Issue I-3 is linked to this PR.
