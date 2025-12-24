import { describe, it, expect, afterAll } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials, cleanup, TEST_INBOX_ID, trackThread } from "./setup";

import { sendMessage } from "../messages/send";
import { listMessages } from "../messages/list";
import { getMessage } from "../messages/get";

describe.skipIf(skipIfNoCredentials())("agentmail messages", () => {
  const ctx = new Context();

  afterAll(cleanup);

  it("send message", async () => {
    // Send message via tool
    const sendResult = await sendMessage.invoke(
      ctx,
      JSON.stringify({
        inbox_id: TEST_INBOX_ID,
        to: `test-${Date.now()}@example.com`,
        subject: `Tool Test ${Date.now()}`,
        text: "Message sent via tool.invoke() integration test",
      }),
    );

    expect(sendResult.state).toBe("completed");
    const sent = sendResult.result as any;
    expect(sent.message_id).toBeDefined();
    expect(sent.thread_id).toBeDefined();

    console.log(`\n✅ Sent message: ${sent.message_id}\n`);
    trackThread(sent.thread_id);
  });

  it("list messages in inbox", async () => {
    const listResult = await listMessages.invoke(
      ctx,
      JSON.stringify({
        inbox_id: TEST_INBOX_ID,
      }),
    );

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.count).toBeDefined();
    expect(list.messages).toBeDefined();

    console.log(`\n✅ Listed ${list.count} messages in inbox\n`);
  });

  it("get specific message from list", async () => {
    // First list to get an existing message
    const listResult = await listMessages.invoke(
      ctx,
      JSON.stringify({
        inbox_id: TEST_INBOX_ID,
      }),
    );

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;

    if (!list.messages || list.messages.length === 0) {
      console.log(`\n⚠️  No messages in inbox to test get\n`);
      return;
    }

    const firstMessage = list.messages[0];

    // Get the message via tool
    const getResult = await getMessage.invoke(
      ctx,
      JSON.stringify({
        inbox_id: TEST_INBOX_ID,
        message_id: firstMessage.id,
      }),
    );

    expect(getResult.state).toBe("completed");
    const fetched = getResult.result as any;
    expect(fetched.id).toBe(firstMessage.id);

    console.log(`\n✅ Fetched message: ${fetched.subject}\n`);
  });
});
