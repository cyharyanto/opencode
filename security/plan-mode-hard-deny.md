# Plan mode write denial can be overridden by global permissions

## Summary

**Context:** Plan mode is presented as a planning role that disallows normal workspace edits except plan files.

**Problem:** The plan agent builds its permission rules by adding global user permissions after the plan-specific edit denial. Because permission evaluation uses the last matching rule, broad global permissions such as `edit: allow` or `*: allow` can win over the plan denial.

**Impact:** A user can globally allow edits to reduce prompts, enter plan mode expecting a read-only plan, and still have the agent mutate workspace files.

**Recommendation:** Treat plan mode's no-edit boundary as a hard role constraint by default. Apply global permissions before the plan-mode denial, or split global convenience permissions from explicit plan-agent overrides.

## Evidence

- `packages/opencode/src/agent/agent.ts` merges `defaults`, plan-specific permission rules, then top-level `user` rules for the plan agent.
- `packages/opencode/src/permission/evaluate.ts` chooses the last matching permission rule.
- `write`, `edit`, and `apply_patch` all ask for permission `edit`, so a later broad edit allow can permit workspace writes outside plan files.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Reorder plan-agent permission construction so top-level user rules are applied before the plan hard-deny rules. | Small change, preserves the no-edit promise. | Existing users who intentionally used global permissions to change plan behavior would need a migration path. |
| B | Introduce hard role constraints that are evaluated after normal permissions and session permissions. | Makes future role boundaries explicit and auditable. | Larger design change across permission evaluation. |
| C | Keep current precedence but document that top-level permissions override plan mode. | No migration risk. | Weakens a safety boundary and makes plan mode less trustworthy. |

## Recommended Plan

1. Prefer Option A as a contained fix: global permissions should not override the plan role's write denial by default.
2. Add an explicit plan-agent-specific override path if maintainers want to preserve advanced customization.
3. Add a regression test where global `edit: allow` is configured and plan mode still denies workspace writes outside allowed plan files.

## Acceptance Criteria

- [ ] Plan mode denies normal workspace edits even when broad top-level edit permissions are configured.
- [ ] Plan-file write exceptions continue to work.
- [ ] Any way to override plan mode is explicit to the plan agent rather than accidental through global permissions.
