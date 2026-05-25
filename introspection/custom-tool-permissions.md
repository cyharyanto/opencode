# Custom tool permission contract

## Summary
n**Context:** opencode supports built-in tools, MCP tools, plugin tools, and config-directory tools.

**Problem:** Plugin and config-directory tools receive an `ask` helper, but the host does not enforce a permission check before executing them. That means custom-tool rules that should ask or deny are only enforced when each tool voluntarily calls `ask` correctly.

**Impact:** Restricted agents or user-configured dynamic-tool rules can lose their intended action boundary around custom tools.

**Recommendation:** Add a host-enforced permission contract for custom tools before execution.

## Evidence

- Custom tool adapter passes `ask` into plugin context and then calls the plugin execute function: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/registry.ts#L158-L186
- Session tool wrapper executes registry tools without a host-side permission check: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/tools.ts#L75-L112
- MCP tools use a host-side `ctx.ask` before execution, which is the stronger pattern to mirror or adapt: https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/session/tools.ts#L123-L146

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Require each custom tool to declare a permission key/category and have the host call `ctx.ask` before execution. | Deterministic and explicit; supports deny/ask rules. | Requires schema/config migration for existing tools. |
| B | Default every custom tool to `ask` using its tool ID unless it declares a safer category. | Safer default; smaller API addition. | May add prompts for harmless read-only tools until categorized. |
| C | Keep voluntary plugin `ask` only and document the expectation. | Lowest compatibility risk. | Does not fix the host enforcement gap. |

## Recommended Plan

1. Add custom-tool permission metadata, with a conservative default for undeclared tools.
2. Wrap plugin and config-directory tool execution with a host-side permission check.
3. Preserve the existing plugin `ask` helper for finer-grained prompts inside tools.
4. Add tests for a deny rule blocking a custom tool that does not call `ask` itself.

## Acceptance Criteria

- [ ] Custom tools cannot bypass host-level ask/deny rules.
- [ ] Existing plugins can still request finer-grained approvals through `ask`.
- [ ] Regression tests cover deny and ask behavior for custom tools.
