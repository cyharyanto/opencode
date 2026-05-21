# Assistant terminal rendering lacks control-sequence sanitization

## Summary

**Context:** opencode's CLI/TUI renders assistant and tool output into terminal scrollback, including markdown bodies.

**Problem:** Shell tool output strips ANSI before rendering, but assistant markdown is passed to the terminal markdown component without a shared control-character sanitizer.

**Impact:** Prompt-injected content can ask the model to emit terminal control sequences or deceptive terminal markup that reaches the CLI/TUI output path as assistant content instead of being neutralized first.

**Recommendation:** Add a shared terminal-output sanitizer for assistant, reasoning, and tool markdown bodies before they reach terminal renderers.

## Evidence

- `packages/opencode/src/cli/cmd/run/entry.body.ts` converts assistant text directly into a markdown body.
- `packages/opencode/src/cli/cmd/run/scrollback.writer.tsx` passes markdown content to the terminal markdown component.
- `packages/opencode/src/cli/cmd/run/tool.ts` strips ANSI from shell output, showing this risk is already recognized for one output path but not applied consistently.

Related: Introspection issue 8

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| A | Strip C0/C1 controls, ANSI CSI, OSC, DCS, and related terminal-control sequences from assistant/reasoning/tool markdown before rendering. | Directly closes the terminal-control path. | Needs careful preservation of normal newlines/tabs and markdown formatting. |
| B | Escape controls into visible placeholders rather than removing them. | Makes suspicious content auditable. | Can be noisy in legitimate binary-ish output. |
| C | Sanitize at the scrollback writer boundary for every body type. | Centralized and hard to bypass. | Must avoid breaking intentionally rendered terminal UI elements. |

## Recommended Plan

1. Add a terminal sanitizer helper with fixtures for ANSI CSI, OSC 8 hyperlinks, OSC 52 clipboard payloads, BEL/ST terminators, and raw escape/control bytes.
2. Apply it at the markdown/text body boundary for assistant and reasoning output, and at any tool markdown path that is not already stripped.
3. Keep shell-output stripping but route it through the shared helper for consistency.
4. Add regression tests that render malicious assistant markdown and verify only inert text reaches the scrollback body.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] Assistant and reasoning output cannot pass terminal control sequences into CLI/TUI renderers.
- [ ] Shell/tool output keeps equivalent or stronger sanitization than today.
- [ ] Tests cover ANSI/OSC/control-character payloads and ordinary markdown.
