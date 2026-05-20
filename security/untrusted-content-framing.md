# Untrusted content channels lack shared prompt-injection framing

## Summary

**Context:** opencode feeds the model user prompts, file/resource attachments, web pages, MCP resources, and tool outputs so the agent can reason over real coding context.

**Problem:** Those channels do not share one prompt-injection defense convention that marks their bytes as untrusted data rather than instructions.

**Impact:** A malicious file, webpage, MCP response, or repository-controlled command output can try to redirect the agent while appearing to be ordinary task context.

**Recommendation:** Introduce one shared untrusted-content envelope for all model-bound direct attachments and secondary content, then apply it at message construction instead of relying on per-tool ad hoc shapes.

## Evidence

- `packages/opencode/src/session/prompt.ts` converts MCP resources, text data URLs, and file reads into synthetic text in the user turn.
- `packages/opencode/src/tool/webfetch.ts` returns fetched page bodies directly as tool output.
- `packages/opencode/src/session/tools.ts` flattens MCP text and resource content into output text.
- `packages/opencode/src/session/message-v2.ts` passes completed tool output strings and objects into model messages without a shared data-not-instruction wrapper.

## What I Found

Several paths preserve useful structure such as tool names, content tags, paths, or provider tool-result roles, but the system does not consistently state the trust rule the model should apply to the content. The absence is cross-channel: fixing only web fetch or only file reads would leave the next channel as the cheapest injection route.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Add a shared envelope helper and use it for attachments, web/MCP outputs, read/shell outputs, and similar secondary content. | Consistent, testable, low architectural risk. | Requires careful provider/message-format compatibility testing. |
| B | Add per-tool prompt-injection warnings in each tool description/output formatter. | Easy incremental migration. | Remains ad hoc; new tools can forget the convention. |
| C | Add a prompt-firewall classifier before content reaches the model. | Can block obvious payloads. | Larger dependency and false-positive trade-offs; does not replace source/provenance framing. |

## Recommended Plan

1. Implement Option A as the baseline control and keep per-tool formatting as source/provenance detail inside the envelope.
2. Define envelope fields for source kind, source name, authority level, and content body.
3. Apply the envelope to direct file/resource attachments, fetched web content, MCP text/resources, and completed tool outputs that contain external or repository-controlled bytes.
4. Add refusal-language coverage in the shared system prompt text for instruction override, persona switch, format coercion, and content claiming to be a system/developer message.
5. Scrub or neutralize harness markers and common provider role markers inside enveloped content before dispatch.
6. Add tests around representative model-message construction paths so new channels cannot bypass the envelope.

## Acceptance Criteria

- [ ] Linked issue is associated with this PR in Introspection.
- [ ] Direct attachments and secondary content use the same lower-trust envelope before reaching the model.
- [ ] Web, MCP, read/file, shell/process, and generic tool-output paths have explicit source/trust metadata or documented exclusions.
- [ ] The prompt tells the model that enveloped content is data and cannot override trusted instructions.
- [ ] Harness markers and common provider role markers are neutralized or otherwise made non-authoritative inside enveloped content.
- [ ] Tests cover each representative channel and fail if content reverts to raw instruction-equivalent text.
