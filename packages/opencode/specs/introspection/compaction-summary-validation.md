# Compaction Summary Validation

## Summary

Compaction summaries should be treated as durable working memory, not free-form assistant text. The compaction path should validate the required summary sections before accepting the summary as the anchor for future turns.

## Current behavior

- The compaction prompt asks the model to emit a fixed Markdown template.
- The persistence path accepts any non-empty text part as the summary.
- A malformed summary can become the previous-summary anchor for later compactions.

## Recommended fix

Add a small semantic validation step after summary generation:

1. Parse the generated Markdown for the required top-level sections:
   - Goal
   - Constraints & Preferences
   - Progress
   - Key Decisions
   - Next Steps
   - Critical Context
   - Relevant Files
2. Require the Progress subsections for Done, In Progress, and Blocked.
3. If the structure is missing but the model turn otherwise completed, retry once with targeted repair feedback.
4. If the retry still fails, mark compaction failed and keep the existing context boundary instead of accepting malformed memory.
5. Keep the validator tolerant of empty sections that explicitly say `(none)`.

## Tests to add

- A well-formed summary is accepted.
- A one-line or missing-section summary is rejected or repaired.
- Failed repair marks the compaction assistant as errored and does not publish a successful compaction event.
- Previous-summary anchoring only uses validated summary text.

## Implementation note

This does not need a heavyweight Markdown parser. A deterministic heading scanner is enough if it preserves exact section names and produces specific feedback for the retry prompt.
