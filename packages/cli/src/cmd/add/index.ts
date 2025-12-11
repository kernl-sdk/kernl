import { Command } from "commander";

import { toolkit } from "./toolkit";

export const add = new Command("add")
  .description("Add items to your project")
  .addCommand(toolkit);
