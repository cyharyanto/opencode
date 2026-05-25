# Permission review for command shell substitutions

## Summary

**Context:** Command templates can come from local config, skills, and MCP prompts, then become user-facing slash commands.

**Problem:** Template shell substitutions are executed directly before the agent loop runs. That execution path does not use the shell tool, so it bypasses the permission review that users see for normal shell commands.

**Impact:** A command backed by an untrusted or compromised prompt source can execute local shell code just by being invoked.

**Recommendation:** Treat shell substitutions as an action surface: either disable them for external prompt-backed commands or run them through the same permission decision path as shell tool calls.

## Evidence

- The command registry includes commands from config, MCP prompts, and skills.
- Command execution expands arguments, detects `!` shell substitutions, and runs each match through direct process execution.
- The shell tool has its own permission path, but command substitution does not enter that tool path.

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Disable shell substitution for MCP prompt-backed commands and skill commands by default. | Strong boundary for external prompt sources; small change. | Users lose dynamic substitutions in those sources unless an opt-in is added. |
| B | Route substitutions through a shared permission helper equivalent to the shell tool's permission check. | Preserves feature behavior with user review. | Needs careful metadata so the user sees the exact command and source. |
| C | Allow substitution only for local config commands and require explicit config opt-in for every other source. | Backward-compatible for trusted local config. | Still needs clear source labeling and migration docs. |

## Recommended Plan

1. Start with Option A or C so external prompt sources cannot execute shell substitutions silently.
2. If dynamic substitutions remain supported, add permission metadata that shows command source, command name, and the exact shell snippet before execution.
3. Add tests for config, skill, and MCP command templates with `!` substitutions, including the no-execution path for external sources.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] External prompt-backed commands cannot execute local shell substitutions without an explicit reviewed boundary.
- [ ] Any retained substitution path has user-visible permission metadata before execution.
- [ ] Regression tests cover command source differences.
