# Allow-Always Permission Persistence

## Summary

**Context:** Permission replies support `once`, `always`, and `reject`, and startup loads approved permission rules from a project-level permission table.

**Problem:** `always` replies update only the in-memory approved ruleset; the updated ruleset is not written back to storage.

**Impact:** Users can choose an always approval and then be asked again after restart, making permission behavior hard to trust.

**Recommendation:** Either persist always approvals atomically or rename the behavior to session-only so the product contract matches reality.

## Evidence

- `packages/opencode/src/permission/index.ts` initializes `approved` from `PermissionTable`.
- The same service handles `reply("always")` by pushing allow rules into the in-memory `approved` array.
- `packages/opencode/src/session/session.sql.ts` defines a project-keyed permission table for durable approval state.

Linked Introspection issue: /issues/I-3.

## What I Found

The code has a durable storage shape for permissions and reads it on service initialization, but the reply path never updates that table when a user chooses `always`. The in-process tests cover immediate reuse of an always approval, but the storage boundary is not exercised.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Upsert the updated approved ruleset into `PermissionTable` when `reply("always")` succeeds. | Matches user-facing wording and existing table load path. | Needs duplicate/rule ordering policy. |
| B | Keep approvals process-local but rename/copy the UI/API behavior to make that scope explicit. | Lower implementation risk. | Removes expected convenience and leaves restart friction. |
| C | Store always approvals with explicit scope and expiry metadata. | Best long-term governance surface. | Larger schema and migration decision. |

## Recommended Plan

1. Prefer Option A unless product wants `always` to mean only the current process.
2. Define a dedupe rule so repeated always approvals do not grow duplicate rules; preserve rule order so latest explicit decisions remain clear.
3. Add a storage regression test that approves a permission, rebuilds permission service state, and confirms the approval is loaded from the table.
4. Confirm reject and once semantics do not persist anything.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Always approvals survive service/process restart when that is the intended product behavior.
- [ ] Once approvals remain process/request scoped.
- [ ] Duplicate always approvals are deduped or otherwise deliberately ordered.
- [ ] Regression coverage crosses the storage boundary, not only the in-memory pending queue.
