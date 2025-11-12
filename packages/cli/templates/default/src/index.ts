import { Kernl } from "kernl";

import { jarvis } from "@/agents/jarvis";

const kernl = new Kernl();

// --- agents ---
kernl.register(jarvis);

console.log("✓ Kernl application initialized");
console.log("✓ Registered agents:", Array.from(kernl["agents"].keys()));
