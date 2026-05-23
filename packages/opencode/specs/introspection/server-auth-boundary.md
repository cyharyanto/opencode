# Server authentication boundary plan

## Summary

**Context:** The headless server exposes the same workspace, session, permission, and agent-action APIs used by local clients.

**Problem:** When no server password is configured, authorization becomes a pass-through. The CLI only warns, even when mDNS or hostname settings expose the server off localhost.

**Impact:** A reachable unauthenticated server lets another local-network caller drive agent actions against the user's workspace.

**Recommendation:** Keep passwordless loopback development available, but require authentication or an explicit unsafe opt-in before binding or advertising off-device.

## Evidence

- The serve command prints a warning when the password is missing, then starts the server.
- Authorization middleware skips checks whenever no password is configured.
- mDNS serving without an explicit hostname resolves to a non-loopback host and publishes the service.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Refuse non-loopback or mDNS serving unless a password is configured, with an explicit unsafe flag for local experiments. | Strong default boundary; preserves intentional unsafe workflows. | Requires CLI/config migration messaging for users who rely on passwordless LAN access. |
| B | Auto-generate an ephemeral password when serving off loopback without one and print it locally. | Avoids hard failure and protects the API by default. | More state and client UX complexity for attach/editor flows. |
| C | Keep current behavior and strengthen warnings. | Minimal change. | Still leaves a high-authority API unauthenticated when exposed. |

## Recommended Plan

1. Implement option A for `serve` and other network entrypoints that can bind off loopback.
2. Treat mDNS publishing as off-device exposure even if the port is otherwise defaulted.
3. Add tests for passwordless loopback allowed, passwordless mDNS rejected, passwordless non-loopback rejected, and explicit unsafe override allowed.
4. Document the unsafe override in the CLI help text and warning copy.

## Acceptance Criteria

- [ ] Passwordless loopback serving still works for local development.
- [ ] Passwordless mDNS or non-loopback serving fails before starting the server unless the user passes an explicit unsafe override.
- [ ] Authenticated mDNS or non-loopback serving still works.
- [ ] Issue I-4 is linked to this PR.
