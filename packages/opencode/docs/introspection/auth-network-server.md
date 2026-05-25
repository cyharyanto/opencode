# Require auth for network-exposed server modes

## Summary

**Context:** The headless server exposes session, prompt, file, shell, permission, and provider-control routes for local clients.

**Problem:** The server can bind beyond localhost, including through discovery mode, while password auth is still optional.

**Impact:** A user who enables LAN discovery or non-loopback serving can expose local agent control to another network client after only a console warning.

**Recommendation:** Require authentication for non-loopback or discovery server modes unless the user passes an explicit insecure flag.

## Evidence

- The serve command only prints a warning when no password is configured.
- Discovery mode can default the host to 0.0.0.0.
- Workspace routing can select a local directory from the request.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Refuse non-loopback and discovery modes without a password. | Safest default. | Can break existing local network workflows. |
| B | Require an explicit --insecure flag for those modes. | Preserves workflows with visible intent. | Still permits risky deployments. |
| C | Generate a temporary password automatically. | Safer and convenient. | More client coordination work. |

## Recommended Plan

1. Implement option B first, with clear CLI/config naming.
2. Keep localhost behavior unchanged.
3. Add tests for localhost without password, non-loopback without password, non-loopback with password, and explicit insecure mode.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Non-loopback or discovery server modes cannot start unauthenticated by accident.
- [ ] Localhost-only development remains convenient.
