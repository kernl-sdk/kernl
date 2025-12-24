import { describe, it, expect, afterAll } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials, cleanup, TEST_INBOX_ID } from "./setup";

import { listThreads } from "../threads/list";
import { getThread } from "../threads/get";

describe.skipIf(skipIfNoCredentials())("agentmail threads", () => {
  const ctx = new Context();

  afterAll(cleanup);

  it("get thread from list", async () => {
    // First list to get an existing thread
    const listResult = await listThreads.invoke(ctx, JSON.stringify({}));

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;

    if (!list.threads || list.threads.length === 0) {
      console.log(`\n⚠️  No threads to test get\n`);
      return;
    }

    const firstThread = list.threads[0];

    // Get thread via tool
    const getResult = await getThread.invoke(
      ctx,
      JSON.stringify({ thread_id: firstThread.id }),
    );

    expect(getResult.state).toBe("completed");
    const thread = getResult.result as any;
    expect(thread.id).toBe(firstThread.id);
    expect(thread.messages).toBeDefined();

    console.log(`\n✅ Fetched thread: ${thread.subject}\n`);
  });

  it("list threads (org-wide and inbox-specific)", async () => {
    // List threads org-wide
    const listResult = await listThreads.invoke(ctx, JSON.stringify({}));

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.count).toBeDefined();
    expect(list.threads).toBeDefined();

    console.log(`\n✅ Listed ${list.count} threads org-wide`);

    // List threads for specific inbox
    const listInboxResult = await listThreads.invoke(
      ctx,
      JSON.stringify({ inbox_id: TEST_INBOX_ID }),
    );

    expect(listInboxResult.state).toBe("completed");
    const inboxList = listInboxResult.result as any;
    expect(inboxList.count).toBeDefined();
    expect(inboxList.threads).toBeDefined();

    console.log(`✅ Listed ${inboxList.count} threads in inbox\n`);
  });
});
