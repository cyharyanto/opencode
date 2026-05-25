# Structured output retry contract

## Summary

**Context:** The prompt API supports schema output through a `json_schema` format with a `retryCount` setting.

**Problem:** The retry setting is defined but not consumed. If the model finishes without calling the structured-output tool, the prompt loop records a terminal error with zero retries.

**Impact:** Callers can get an avoidable hard failure after one missed tool call instead of a bounded repair attempt.

**Recommendation:** Honor `retryCount` with explicit feedback before returning a terminal structured-output error.

## Evidence

- The schema-output format defines `retryCount` with a default of 2: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/message-v2.ts#L62-L74
- The prompt loop requires the structured-output tool but writes `StructuredOutputError` with `retries: 0` and breaks on the first miss: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/prompt.ts#L1388-L1457

## Implementation Plan

1. Track structured-output retry attempts inside the prompt loop for the current user message.
2. When the model finishes without the structured-output tool and attempts remain, append feedback that the final response must call the tool with schema-valid data.
3. Continue the loop until either structured output is captured or `retryCount` is exhausted.
4. Persist the terminal `StructuredOutputError` with the actual retry count used.
5. Add tests for success after retry and failure after retry exhaustion.

## Acceptance Criteria

- [ ] `retryCount` controls the number of repair attempts for missed structured-output tool calls.
- [ ] The model receives concrete feedback on each repair attempt.
- [ ] Terminal errors record how many retries were attempted.
