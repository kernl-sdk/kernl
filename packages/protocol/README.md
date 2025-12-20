# kernl - Protocol Specification

## Realtime :: Protocol

### Client Events

| Event                 | Purpose                        | Key Fields                               |
|-----------------------|--------------------------------|------------------------------------------|
| session.update        | Configure session              | config: SessionConfig                    |
| item.create           | Add item to conversation       | item: LanguageModelItem, previousItemId? |
| item.delete           | Remove item                    | itemId                                   |
| item.truncate         | Truncate assistant audio       | itemId, audioEndMs                       |
| audio.input.append    | Stream audio chunk to buffer   | audio: string (base64)                   |
| audio.input.commit    | Commit buffer as user message  | —                                        |
| audio.input.clear     | Discard buffered audio         | —                                        |
| activity.start        | User started speaking          | —                                        |
| activity.end          | User stopped speaking          | —                                        |
| response.create       | Trigger response (manual mode) | config?: ResponseConfig                  |
| response.cancel       | Cancel in-progress response    | responseId?                              |

### Server Events

| Event                             | Purpose                      | Key Fields                 |
|-----------------------------------|------------------------------|----------------------------|
| session.created                   | Session ready                | session: Session           |
| session.updated                   | Config updated               | session: Session           |
| session.error                     | Session error                | error: Error               |
| item.created                      | Item added                   | item: LanguageModelItem    |
| item.deleted                      | Item removed                 | itemId                     |
| item.truncated                    | Audio truncated              | itemId, audioEndMs         |
| audio.input.committed             | Buffer committed             | itemId                     |
| audio.input.cleared               | Buffer cleared               | —                          |
| speech.started                    | VAD: speech detected         | audioStartMs, itemId       |
| speech.stopped                    | VAD: speech ended            | audioEndMs, itemId         |
| audio.output.delta                | Agent audio chunk            | responseId, itemId, delta  |
| audio.output.done                 | Agent audio complete         | responseId, itemId         |
| text.output.delta                 | Agent text chunk             | responseId, itemId, delta  |
| text.output                       | Agent text complete          | responseId, itemId, text   |
| transcript.input.delta            | User speech → text chunk     | itemId, delta              |
| transcript.input                  | User speech → text complete  | itemId, text               |
| transcript.output.delta           | Agent speech → text chunk    | responseId, itemId, delta  |
| transcript.output                 | Agent speech → text complete | responseId, itemId, text   |
| response.created                  | Response started             | responseId                 |
| response.interrupted              | Response interrupted         | responseId                 |
| response.done                     | Response complete            | responseId, status, usage  |
| tool.start                        | Tool call started            | responseId, callId, toolId |
| tool.delta                        | Tool arguments streaming     | callId, delta              |
| tool.call                         | Tool call ready              | callId, toolId, arguments  |
| tool.cancelled                    | Tool call cancelled          | callId                     |
