# Primary agent loop budget plan

## Summary

**Context:** Primary agents can be configured with a `steps` limit, and the loop adds a max-step reminder when that limit is reached.

**Problem:** Built-in primary agents do not set a default limit, so runs default to an unbounded step count. The repeated-call guard only catches identical recent tool calls, not varied tool-use loops.

**Impact:** A task can consume cost and context for much longer than intended until the user cancels it, the provider stops, or the context overflows.

**Recommendation:** Add a conservative default budget for primary agents and require an explicit configuration choice for unbounded runs.

## Evidence

- The session loop computes the step budget from the configured agent limit or `Infinity`.
- The max-step reminder is only added when a configured limit is reached.
- The doom-loop permission path only triggers after repeated identical tool calls.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Set a default step budget for built-in primary agents and allow user config to raise or disable it explicitly. | Simple, predictable, and preserves advanced override. | Needs careful default selection to avoid interrupting legitimate long tasks. |
| B | Add an interactive confirmation every N steps while keeping no hard default. | Flexible for long tasks. | Less useful for non-interactive runs and can still waste cost before confirmation. |
| C | Only rely on context overflow, cancellation, and doom-loop detection. | No behavior change. | Does not bound varied tool loops. |

## Recommended Plan

1. Implement option A with a conservative default for primary agents and no change to hidden support agents unless they need separate limits.
2. Make `steps: null` or another explicit config value the documented way to request unbounded execution, if unbounded runs remain supported.
3. Add tests that built-in primary agents receive the default, configured agents can override it, and the loop adds the max-step reminder at the expected boundary.
4. Keep the existing identical-call guard as a separate safety net.

## Acceptance Criteria

- [ ] Built-in primary agents no longer default to an unbounded step count.
- [ ] Users can intentionally configure a higher or unbounded limit with clear semantics.
- [ ] Non-interactive runs surface a clear stop reason when the budget is reached.
- [ ] Issue I-5 is linked to this PR.
