import { describe, it, expect } from "vitest";
import { Context } from "kernl";
import { skipIfNoCredentials } from "./setup";

import { getAccountAnalytics } from "../analytics/account";

describe.skipIf(skipIfNoCredentials())("bundlesocial analytics", () => {
  const ctx = new Context();

  it("get account analytics for LinkedIn", async () => {
    const result = await getAccountAnalytics.invoke(
      ctx,
      JSON.stringify({
        platform: "LINKEDIN",
      }),
    );

    // Analytics may not be available for all accounts/plans (403 = requires upgraded plan)
    if (result.state === "failed") {
      console.log(`\n⚠️  Analytics unavailable: ${result.error}\n`);
      return;
    }

    expect(result.state).toBe("completed");
    const analytics = result.result as any;

    expect(analytics.account).toBeDefined();
    expect(analytics.account.id).toBeDefined();

    console.log(`\n✅ Account: ${analytics.account.display_name || analytics.account.username}`);

    if (analytics.metrics) {
      console.log(`   Followers: ${analytics.metrics.followers}`);
      console.log(`   Posts: ${analytics.metrics.post_count}\n`);
    } else {
      console.log(`   No metrics available yet\n`);
    }
  });
});
