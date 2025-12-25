import { describe, it, expect, afterAll } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials, cleanup } from "./setup";

import { createPost } from "../posts/create";
import { getPost } from "../posts/get";
import { listPosts } from "../posts/list";
import { deletePost } from "../posts/delete";

describe.skipIf(skipIfNoCredentials())("bundlesocial posts", () => {
  const ctx = new Context();

  afterAll(cleanup);

  it("create → get → list → delete flow", async () => {
    // Create post via tool
    const createResult = await createPost.invoke(
      ctx,
      JSON.stringify({
        title: `Tool Test ${Date.now()}`,
        post_date: new Date().toISOString(),
        status: "SCHEDULED",
        platforms: ["LINKEDIN"],
        data: {
          LINKEDIN: {
            text: "Posted via tool.invoke() integration test",
          },
        },
      }),
    );

    if (createResult.state === "failed") {
      console.log(`\n❌ Create failed: ${createResult.error}\n`);
    }
    expect(createResult.state).toBe("completed");
    const created = createResult.result as any;
    expect(created.id).toBeDefined();

    console.log(`\n✅ Created post: ${created.id}`);

    // Get post via tool
    const getResult = await getPost.invoke(
      ctx,
      JSON.stringify({ id: created.id }),
    );

    expect(getResult.state).toBe("completed");
    const fetched = getResult.result as any;
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toContain("Tool Test");

    // List posts via tool
    const listResult = await listPosts.invoke(
      ctx,
      JSON.stringify({
        limit: 10,
      }),
    );

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.items.some((p: any) => p.id === created.id)).toBe(true);

    // Delete post via tool
    const deleteResult = await deletePost.invoke(
      ctx,
      JSON.stringify({ id: created.id }),
    );

    expect(deleteResult.state).toBe("completed");
    const deleted = deleteResult.result as any;
    expect(deleted.id).toBe(created.id);
    expect(deleted.deleted).toBe(true);

    console.log(`✅ Deleted post: ${created.id}\n`);
  });
});
