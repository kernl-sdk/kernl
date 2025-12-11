import type { RegistryItem } from "./types";

export const toolkits: RegistryItem[] = [
  {
    name: "hello",
    type: "registry:toolkit",
    title: "Hello Toolkit",
    description: "A simple greeting toolkit for testing the registry",
    dependencies: [],
    env: [],
    files: [
      { path: "toolkits/hello/index.ts" },
      { path: "toolkits/hello/greet.ts" },
    ],
  },
];
