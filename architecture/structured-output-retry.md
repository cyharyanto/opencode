# Structured-output retry loop

## Summary

**Context:** Session prompts can request JSON-schema output with a `retryCount`.

**Problem:** If the model finishes without calling the final structured-output tool, the runtime records a structured-output error with zero retries and stops immediately.

**Impact:** Recoverable first misses become hard failures for API callers that asked for structured JSON.

**Recommendation:** Honor the configured retry count with corrective feedback before failing.

## Evidence

- `packages/opencode/src/session/message-v2.ts` defines `json_schema.retryCount` with a default of 2.
- `packages/opencode/test/session/structured-output.test.ts` asserts the default and custom retry count parsing.
- `packages/opencode/src/session/prompt.ts` creates the structured-output tool, but the no-tool-call failure path records `retries: 0` and breaks.

## Recommended Plan

1. Track structured-output attempts within the prompt loop for each JSON-schema request.
2. When the model finishes without a structured-output tool call, append a corrective synthetic message that explains the missing final tool call and retry while attempts remain.
3. Use the stored `retryCount` as the limit and record the actual attempts on final failure.
4. Add tests for default retries, custom retries, success after repair, and final failure after the limit.

## Acceptance Criteria

- [ ] A missed structured-output tool call retries up to the configured count.
- [ ] Corrective feedback is specific enough for the model to repair the response.
- [ ] Final failures report the actual retry count used.
- [ ] Text-mode prompts remain unchanged.
- [ ] The issue is linked to this PR.
