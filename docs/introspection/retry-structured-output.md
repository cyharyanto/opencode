# Recoverable structured output retries

## Summary

**Context:** API clients can request JSON-schema-shaped output, and the prompt loop exposes a retry count for this format.

**Problem:** When the model finishes without calling the structured-output tool, the loop records an error with zero retries and stops immediately.

**Impact:** A single repairable formatting miss becomes a hard failure for clients that need schema-shaped responses.

**Recommendation:** Consume the declared retry budget and retry with explicit feedback before returning a structured-output error.

## Evidence

- The JSON-schema output format defaults `retryCount` to 2: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/message-v2.ts#L64-L68).
- The prompt loop records a structured-output error with `retries: 0` and breaks after the first miss: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/prompt.ts#L1449-L1458).
- The StructuredOutput tool accepts schema-validated arguments when called: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/prompt.ts#L1732-L1758).

## Implementation Plan

1. Track structured-output attempts for the active user request.
2. When the model finishes without captured structured output and attempts remain, append a concise synthetic feedback turn that says the response must call the StructuredOutput tool and then continue the loop.
3. When attempts are exhausted, keep the existing StructuredOutputError behavior but record the number of attempts used.
4. Add unit coverage for success on the first attempt, retry-after-miss, and exhausted retries.

## Verification

- Run the structured-output unit tests added for the prompt loop.
- Run the package typecheck.

## Acceptance Criteria

- [ ] The linked issue is attached to this PR.
- [ ] `retryCount` controls repair attempts for missed structured-output tool calls.
- [ ] Final errors report attempts accurately.
- [ ] Existing successful structured-output behavior is unchanged.
