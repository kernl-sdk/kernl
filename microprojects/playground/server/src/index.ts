import { serve } from "@kernl-sdk/server";

import { build } from "./app";

const kernl = build();
serve(kernl, { port: 3001 });
