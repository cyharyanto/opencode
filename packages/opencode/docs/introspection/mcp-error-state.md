# Preserve MCP tool error state

## Summary

MCP tool execution errors should stay visible as failures or recoverable error states while retaining the content returned by the server. Today the wrapper flattens content into an ordinary completed tool output and drops the isError flag.

## Evidence

- The MCP wrapper reads result.content and metadata into normal output.
- The official MCP tools spec says tool execution errors are returned with isError: true.
- Session state currently has no durable distinction between that MCP error result and a successful tool result with text output.

## Changes

- Preserve result.isError in tool metadata.
- Surface isError=true as a failed or explicitly recoverable tool state instead of ordinary success.
- Keep returned text and attachments available so the model can recover from the failure details.
- Add a test with a fake MCP tool returning isError=true.

## Verification

- Run MCP/tool wrapper tests.
- Confirm normal MCP results remain completed.
- Confirm isError=true results are visible as failures or recoverable error states.

## Acceptance Criteria

- [ ] Issue is linked to this PR.
- [ ] MCP execution errors are not stored as ordinary completed outputs.
- [ ] Error content remains available to the model and user.
