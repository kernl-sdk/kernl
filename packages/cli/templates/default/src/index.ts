import { Kernl } from "kernl";
// import { postgres } from "@kernl-sdk/pg";

import { jarvis } from "@/agents/jarvis";

const kernl = new Kernl({
  storage: {
    db: undefined,
    // db: postgres({ connstr: process.env.DATABASE_URL }), // if you want thread persistence + memories
  },
});

kernl.register(jarvis);

const result = await jarvis.run("Calculate 15 * 7");
console.log(result.response);

const stream = jarvis.stream("What's 100 divided by 4, then subtract 10?");

// stream text deltas to console
for await (const event of stream) {
  if (event.kind === "text-delta") {
    process.stdout.write(event.text);
  }
}
