# Consistent sensitive-file gates for search

## Summary

**Context:** OpenCode applies permission rules to file reads and content search so users can decide which workspace data the agent may inspect.

**Problem:** Direct reads have sensitive `.env` path rules, but content search asks permission only for the regex pattern and can return matched secret-file lines.

**Impact:** A normal coding search for tokens, keys, or passwords can disclose secret lines that users expect to approve before direct file access.

**Recommendation:** Apply sensitive-path checks to search results before returning content, and align the documented default with the implemented behavior.

## Evidence

- Default read rules single out `.env`-style files: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/agent/agent.ts#L115-L121).
- The grep tool asks for the regex pattern, not the paths of files whose contents are returned: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/tool/grep.ts#L45-L78).
- The ripgrep wrapper searches hidden files: [source](https://github.com/cyharyanto/opencode/blob/dev/packages/opencode/src/file/ripgrep.ts#L209-L217).

## What I Found

The permission model treats direct file reads and search results differently even though both reveal file contents. Search output includes the matched line text, so path-sensitive read controls need an equivalent check in the search path.

## Options

| Option | What changes | Pros | Cons |
| ------ | ------------ | ---- | ---- |
| A | Filter or gate grep matches by applying read permission to each matched file before returning lines. | Strongest consistency with direct read behavior. | Needs careful batching so many matches do not create noisy prompts. |
| B | Exclude sensitive paths from search by default and return a notice that matches were withheld. | Simple and safe default. | Less useful when a user intentionally wants to inspect a secret file. |
| C | Add a dedicated `search_sensitive` permission. | Clear product-level semantics. | More config surface and migration/docs work. |

## Recommended Plan

1. Implement Option A with batching: group matched files that need approval and ask once before including their line contents.
2. Withhold or summarize denied sensitive matches without printing line text.
3. Update permission docs so `.env` defaults match the implemented action.
4. Add regression coverage for searching `.env`, `.env.example`, and ordinary files.

## Acceptance Criteria

- [ ] The linked issue is attached to this PR.
- [ ] Search no longer prints sensitive-file line contents unless the matching file path is allowed.
- [ ] Denied sensitive matches are reported without disclosing values.
- [ ] Permission documentation matches code.
