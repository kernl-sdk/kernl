import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";
import { UnimplementedError } from "@kernl-sdk/shared/lib";

import { create_client, create_storage } from "./helpers";

describe("LibSQLStorage transaction", () => {
  let client: Client;

  beforeEach(() => {
    client = create_client();
  });

  afterEach(() => {
    client.close();
  });

  it("throws UnimplementedError until implemented", async () => {
    const storage = create_storage(client);

    await expect(storage.transaction(async () => {})).rejects.toThrow(
      UnimplementedError,
    );
  });
});
