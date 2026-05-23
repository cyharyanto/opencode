# Agent step cap enforcement

## Summary

**Context:** Agent configuration supports a `steps` limit described as the maximum number of agentic iterations before a text-only response is forced.

**Problem:** The runtime currently appends a max-steps reminder at the cap, but still sends the available tool set to the model. The cap therefore depends on model compliance rather than runtime enforcement.

**Impact:** A custom agent with a low step limit can continue taking tool actions and spending tokens if the model calls tools after the reminder.

**Recommendation:** Make the step cap a deterministic loop/tool boundary.

## Evidence

- `packages/opencode/src/config/agent.ts` documents `steps` as forcing text-only response.
- `packages/opencode/src/session/prompt.ts` computes the final step and appends the max-steps reminder, but still resolves and passes tools into the model call.
- `packages/opencode/src/session/llm.ts` filters tools by permissions and user-disabled tools, not by the step cap.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Pass an empty tool map and `toolChoice: "none"` on the capped step. | Matches the documented text-only behavior. | Needs compatibility checks for providers with prior tool history. |
| B | Stop the loop immediately when the step cap is reached and return a system-authored cap message. | Strictest cost/action bound. | Gives the model no chance to summarize final state. |
| C | Keep current reminder but add a post-stream guard that rejects any capped-step tool call. | Preserves provider behavior while enforcing the boundary. | Later and less clear than disabling tools before the call. |

## Recommended Plan

1. Prefer Option A so the model gets one final text-only chance while tools are unavailable.
2. If a provider requires a compatibility stub because prior messages include tool calls, keep the stub non-executable.
3. Add tests where an agent with `steps: 1` receives a tool-capable model response and the tool is not executed.

## Acceptance Criteria

- [ ] At the configured cap, normal tools are unavailable to the model.
- [ ] The loop does not continue into extra tool-execution steps after the cap.
- [ ] Existing uncapped agents keep normal tool behavior.
- [ ] The issue is linked to this PR.
