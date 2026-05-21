# MCP tool approvals do not distinguish sensitive arguments

## Summary

**Context:** opencode lets configured MCP servers add model-callable tools to the coding agent.

**Problem:** The current MCP wrapper asks for approval using a wildcard pattern for the entire tool and then forwards the model-supplied arguments to the MCP server. That makes a harmless approval indistinguishable from a later sensitive call to the same MCP capability.

**Impact:** A malicious repository, fetched page, or compromised MCP resource can steer the agent to reuse a previously approved MCP tool for sensitive file, repository, ticket, or remote-resource arguments without a fresh argument-aware approval prompt.

**Recommendation:** Add argument-aware MCP approval keys and fall back to per-call approval when arguments cannot be safely summarized.

## Evidence

- `packages/opencode/src/session/tools.ts` asks permission for MCP calls with `patterns: ["*"]` and `always: ["*"]` before executing the MCP tool.
- `packages/opencode/src/permission/index.ts` stores “always” approvals by permission and pattern, so the wildcard approval applies to later calls for that tool.

Related: Introspection issue 6

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Build approval patterns from tool name plus a stable argument summary for known sensitive fields such as paths, URLs, repo names, issue IDs, and resource URIs. | Preserves existing permission UX while distinguishing high-risk calls. | Needs careful per-tool schema inspection and safe formatting. |
| B | Treat all MCP calls as per-call approvals unless the MCP server declares a safe approval key or risk metadata. | Safer default for unknown tools. | More permission prompts for benign MCP workflows. |
| C | Add MCP server-level trust profiles that choose between per-call, argument-aware, and broad approval. | Flexible for trusted internal servers. | Requires product configuration and clear defaults. |

## Recommended Plan

1. Introduce an MCP approval-key helper that takes the tool name, input schema, and args and returns one or more stable approval patterns.
2. Use known argument families first: filesystem paths, URLs, resource URIs, repository names, issue/ticket IDs, and mutation targets.
3. If no safe summary can be produced, ask per call and avoid adding a wildcard `always` approval.
4. Keep server/tool-level configuration as an override only after safe defaults exist.
5. Add tests for harmless and sensitive argument changes on the same MCP tool.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] MCP approval prompts distinguish sensitive argument changes for the same tool.
- [ ] Wildcard always-approval is not the default for unknown MCP tool arguments.
- [ ] Tests cover once and always approvals for changed MCP arguments.
