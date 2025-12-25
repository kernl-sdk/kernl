import { describe, it, expect, afterAll } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials, cleanup } from "./setup";

import { createPost } from "../posts/create";
import { deletePost } from "../posts/delete";
import { createComment } from "../comments/create";
import { listComments } from "../comments/list";
import { deleteComment } from "../comments/delete";

describe.skipIf(skipIfNoCredentials())("bundlesocial comments", () => {
  const ctx = new Context();
  let testPostId: string;

  afterAll(async () => {
    if (testPostId) {
      await deletePost.invoke(ctx, JSON.stringify({ id: testPostId }));
    }
    await cleanup();
  });

  it("create → list → delete comment flow", async () => {
    // First create a post to comment on
    const postResult = await createPost.invoke(
      ctx,
      JSON.stringify({
        title: `Comment Test Post ${Date.now()}`,
        post_date: new Date().toISOString(),
        status: "SCHEDULED",
        platforms: ["LINKEDIN"],
        data: {
          LINKEDIN: {
            text: "Post for comment testing",
          },
        },
      }),
    );

    expect(postResult.state).toBe("completed");
    const post = postResult.result as any;
    testPostId = post.id;

    console.log(`\n✅ Created test post: ${testPostId}`);

    // Create a comment on the post
    const createResult = await createComment.invoke(
      ctx,
      JSON.stringify({
        title: `Test Comment ${Date.now()}`,
        post_id: testPostId,
        post_date: new Date().toISOString(),
        status: "SCHEDULED",
        platforms: ["LINKEDIN"],
        text: "This is a test comment via tool.invoke()",
      }),
    );

    expect(createResult.state).toBe("completed");
    const comment = createResult.result as any;
    expect(comment.id).toBeDefined();

    console.log(`✅ Created comment: ${comment.id}`);

    // List comments
    const listResult = await listComments.invoke(
      ctx,
      JSON.stringify({
        limit: 10,
      }),
    );

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.items.some((c: any) => c.id === comment.id)).toBe(true);

    console.log(`✅ Found comment in list (total: ${list.total})`);

    // Delete comment
    const deleteResult = await deleteComment.invoke(
      ctx,
      JSON.stringify({ id: comment.id }),
    );

    expect(deleteResult.state).toBe("completed");
    const deleted = deleteResult.result as any;
    expect(deleted.id).toBe(comment.id);
    expect(deleted.deleted).toBe(true);

    console.log(`✅ Deleted comment: ${comment.id}\n`);
  });
});
