---
"@kernl-sdk/ai": patch
---

fix: handle tool result errors with error-text output

When a tool call fails and returns an error, the MESSAGE codec now properly encodes the error using the AI SDK's error-text output type instead of attempting to send null as a json value. This fixes the "Missing required parameter: 'output'" error that occurred when MCP tools returned errors.
