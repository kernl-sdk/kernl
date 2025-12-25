import { describe, it, expect } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials } from "./setup";

import { listThreads, getThread } from "../threads";

describe.skipIf(skipIfNoCredentials())("agentmail threads", () => {
  const ctx = new Context();

  it("get thread from list", async () => {
    const listResult = await listThreads.invoke(ctx, JSON.stringify({}));

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;

    if (!list.threads || list.threads.length === 0) {
      console.log(`\n⚠️  No threads to test get\n`);
      return;
    }

    const firstThread = list.threads[0];

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

  it("list threads", async () => {
    const listResult = await listThreads.invoke(ctx, JSON.stringify({}));

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.count).toBeDefined();
    expect(list.threads).toBeDefined();

    console.log(`\n✅ Listed ${list.count} threads\n`);
  });
});
