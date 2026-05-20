# Project instruction files can override coding-agent goals

## Summary

**Context:** opencode intentionally reads project guidance so the coding agent can follow repository-specific conventions while editing code.

**Problem:** Project-local instruction files are loaded into instruction-bearing context without a lower-trust boundary from operator/global instructions.

**Impact:** A malicious or unreviewed repository can steer the agent before normal file-content boundaries apply, including asking it to ignore operator constraints or perform unsafe workspace actions.

**Recommendation:** Treat project-local instruction files as repository-authored guidance by default, not as operator authority, and require an explicit promotion path when a user wants to trust a repository's instructions.

## Evidence

- `packages/opencode/src/session/instruction.ts` discovers `AGENTS.md` and `CLAUDE.md` from the project tree and emits them as `Instructions from: ...` text for the model.
- The same service attaches nearby instruction files discovered while reading repository files as system-reminder content.
- `packages/opencode/src/tool/read.ts` appends loaded instruction content to read output after the file content.

## What I Found

The current loader distinguishes global configuration files from project files by source path, but the model-facing text does not preserve that trust distinction. In a coding-agent workflow, repository-authored guidance is useful context, but it is also attacker-controlled when the user opens an unfamiliar repository or dependency.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Wrap project-local instruction files in a lower-trust repository-guidance envelope and tell the model they cannot override operator/global instructions. | Smallest change; keeps automatic repo guidance. | Relies on model adherence to the envelope. |
| B | Prompt the user before loading project-local instruction files from untrusted repositories, then cache the trust decision. | Stronger trust signal; clearer user control. | Adds product/UI state and migration questions. |
| C | Disable automatic project-local instruction loading by default. | Strongest default boundary. | Breaks a core coding-agent convention and likely surprises users. |

## Recommended Plan

1. Implement Option A first: split model-facing instruction rendering into trusted/global and project-local repository guidance.
2. Use a non-colliding envelope for project-local guidance that includes source path, repository/worktree context, and explicit lower-trust semantics.
3. Ensure nearby instruction files discovered during reads use the same repository-guidance envelope instead of system-reminder authority.
4. Add source-level tests around prompt assembly for global instructions, project root instructions, and nested instruction files.
5. Decide separately whether Option B is needed for high-risk contexts such as first-open of a remote repository.

## Acceptance Criteria

- [ ] Linked issue is associated with this PR in Introspection.
- [ ] Project-local instruction files are distinguishable from trusted/global instructions in the model-facing prompt.
- [ ] Repository-authored guidance cannot claim precedence over operator, system, or permission constraints in the prompt text.
- [ ] Nested instruction files discovered during reads use the same lower-trust treatment.
- [ ] Tests cover the trust split and prevent regression to raw `Instructions from: ...` authority for project files.
