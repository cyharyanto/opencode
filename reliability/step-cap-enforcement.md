# Configured step limits do not enforce a hard stop

## Summary

**Context:** Agents can define a maximum number of steps so high-agency runs stay bounded.

**Problem:** The current loop treats the final step as a prompt reminder instead of an enforcement boundary. It still sends the normal available tools to the model and does not force the run to stop if the model calls one.

**Impact:** A model that ignores the reminder can run extra tool steps after the configured limit, including side-effecting reads, shell commands, or edits.

**Recommendation:** Make the configured step limit deterministic by changing the last-step execution path to remove non-final tools, or by stopping before another model/tool step can be scheduled.

## Evidence

- `packages/opencode/src/session/prompt.ts` computes `isLastStep` from `agent.steps`.
- The loop still resolves tools and passes them to the processor on that step.
- The max-step handling only appends a reminder message telling the model not to call tools.
- The processor can process tool calls and return `continue`, which lets the prompt loop start another iteration.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | When `isLastStep` is true, pass no normal tools and allow only an explicit final-answer path. | Deterministic, minimal mental model, preserves final response. | Needs care for structured-output requests that intentionally use a final tool. |
| B | Stop the loop before calling the model once `step > maxSteps`, and convert the prior state into a bounded final message. | Strong hard cap. | May be abrupt if the model needed one final response after tool results. |
| C | Keep the reminder only, but mark the run failed if a tool call appears at the boundary. | Detects violations. | Still spends a model call and may create confusing partial tool state. |

## Recommended Plan

1. Implement Option A for normal text responses: on the configured last step, remove side-effecting and exploratory tools instead of relying on prompt text.
2. Decide whether structured-output finalization should remain available as a special final-answer tool.
3. Add a regression test for an agent with a one-step cap proving a tool call is not executed past the boundary.

## Acceptance Criteria

- [ ] Step-limit enforcement is application-level, not only prompt-level.
- [ ] Final responses still work when the limit is reached.
- [ ] A configured low step cap cannot execute extra tool calls after the boundary.
