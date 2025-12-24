import { describe, it, expect } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials } from "./setup";

import { createDraft } from "../drafts/create";
import { getDraft } from "../drafts/get";
import { listDrafts } from "../drafts/list";
import { deleteDraft } from "../drafts/delete";

describe.skipIf(skipIfNoCredentials())("agentmail drafts", () => {
  const ctx = new Context();

  it("create → get → list → delete flow", async () => {
    const createResult = await createDraft.invoke(
      ctx,
      JSON.stringify({
        to: [`test-${Date.now()}@example.com`],
        subject: `Draft Test ${Date.now()}`,
        text: "Draft created via tool.invoke() integration test",
      }),
    );

    expect(createResult.state).toBe("completed");
    const created = createResult.result as any;
    expect(created.draft_id).toBeDefined();

    console.log(`\n✅ Created draft: ${created.draft_id}`);

    const getResult = await getDraft.invoke(
      ctx,
      JSON.stringify({ draft_id: created.draft_id }),
    );

    expect(getResult.state).toBe("completed");
    const fetched = getResult.result as any;
    expect(fetched.draft_id).toBe(created.draft_id);
    expect(fetched.subject).toContain("Draft Test");

    const listResult = await listDrafts.invoke(ctx, JSON.stringify({}));

    expect(listResult.state).toBe("completed");
    const list = listResult.result as any;
    expect(list.drafts).toBeDefined();
    expect(list.drafts.some((d: any) => d.draft_id === created.draft_id)).toBe(true);

    const deleteResult = await deleteDraft.invoke(
      ctx,
      JSON.stringify({ draft_id: created.draft_id }),
    );

    expect(deleteResult.state).toBe("completed");
    const deleted = deleteResult.result as any;
    expect(deleted.draft_id).toBe(created.draft_id);
    expect(deleted.deleted).toBe(true);

    console.log(`✅ Deleted draft: ${created.draft_id}\n`);
  });
});
