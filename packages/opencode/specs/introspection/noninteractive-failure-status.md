# Non-Interactive Failure Status

## Summary

**Context:** `opencode run` is used by humans and scripts as a non-interactive entry point for coding-agent work.

**Problem:** A prompt that is accepted and then fails mid-stream can emit a session error while the process still exits successfully.

**Impact:** Scripts and CI can continue after failed agent work unless they parse the event stream themselves.

**Recommendation:** Treat terminal session errors during non-interactive runs as command failures, and update the locked subprocess test accordingly.

## Evidence

- `packages/opencode/src/cli/cmd/run.ts` accumulates `session.error` text in the event loop.
- The command only sets `process.exitCode = 1` for immediate SDK result errors.
- `packages/opencode/test/cli/run/run-process.test.ts` explicitly locks the current mid-stream LLM error behavior to exit 0.

Linked Introspection issue: /issues/I-2.

## What I Found

The CLI already has enough event information to know the active session failed, but the error state does not influence the non-interactive command's exit status after the prompt call completes. The current test calls this behavior debatable, which makes it a good targeted cleanup.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Await the event loop result for non-interactive runs and set a nonzero exit when it observed `session.error`. | Minimal and matches current event flow. | Needs care not to hang if the prompt request fails before idle. |
| B | Return assistant/session error status from the prompt API response and let the CLI inspect it directly. | Gives SDK callers a stronger contract too. | Wider API behavior change. |
| C | Add a dedicated strict flag for automation failure semantics. | Avoids changing existing users by default. | Keeps unsafe default behavior for CI unless users discover the flag. |

## Recommended Plan

1. Start with Option A for the CLI path because it matches the issue impact and current event subscription design.
2. Ensure the event loop is awaited or otherwise joined before `execute` returns for non-interactive prompt/command calls.
3. Update the mid-stream failure subprocess test to expect a nonzero exit and retain the existing unknown-model nonzero test.
4. Add a JSON-format assertion so machine-readable mode still emits an error event before exiting nonzero.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Mid-stream model failure causes `opencode run` to exit nonzero.
- [ ] Immediate SDK errors still exit nonzero.
- [ ] Successful runs still print final text/events and exit 0.
- [ ] JSON format keeps parseable event output while returning a failing status for failed sessions.
