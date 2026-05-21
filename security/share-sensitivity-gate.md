# Session sharing lacks a sensitivity gate for transcript parts and diffs

## Summary

**Context:** opencode can share sessions to a remote share endpoint for collaboration or viewing outside the local workspace.

**Problem:** The full-share path syncs the session record, every message, every message part, and session diffs without a local sensitivity classification or redaction step.

**Impact:** A user can share or auto-share a session after the agent has read secrets, private source, shell output, or sensitive diffs, causing those artifacts to leave the local workspace without a targeted warning or redaction control.

**Recommendation:** Add a pre-share sensitivity gate over transcript parts and diffs before remote sync.

## Evidence

- `packages/opencode/src/share/share-next.ts` full sync sends session info, message infos, all message parts, session diffs, and model metadata.
- `packages/opencode/src/share/session.ts` can create shares manually and also supports auto-sharing when configured.

Related: Introspection issue 7

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Scan message parts and diffs for common secret patterns, sensitive file names, and large private payloads before sharing. Warn and require explicit confirmation when risk is found. | Fast to add and directly protects the current egress path. | Pattern-based detection can miss project-specific secrets. |
| B | Redact high-confidence secrets automatically and include a share manifest showing what was removed. | Reduces accidental disclosure even when users proceed. | Requires careful UX around redacted transcript fidelity. |
| C | Add per-session share policy: disabled, warn, redact, or allow. | Lets teams choose their risk posture. | Needs config and migration decisions. |

## Recommended Plan

1. Add a share-preflight pass over message parts and diffs before `full()` sync and before queued incremental syncs.
2. Detect high-confidence secret patterns, sensitive filenames such as `.env`, private key material, and large pasted/tool-output blobs.
3. For manual sharing, present a concise warning with counts and allow the user to cancel or proceed.
4. For auto-sharing, default to blocking or redacting high-confidence sensitive content unless an explicit policy allows it.
5. Add tests for read-tool output, shell output, diffs, and ordinary safe transcripts.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Share sync cannot silently upload high-confidence secrets from transcript parts or diffs.
- [ ] Manual share shows a targeted sensitivity warning when risky content is present.
- [ ] Auto-share has a safe default for risky content.
