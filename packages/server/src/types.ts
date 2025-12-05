import type { Kernl } from "kernl";

export interface HonoOptions {
  /** Base path prefix for all routes (default: "") */
  prefix?: string;
  /** CORS origins (default: ["*"]) */
  cors?: string[];
}

export interface ServeOptions extends HonoOptions {
  port?: number;
  hostname?: string;
}

export type Variables = {
  kernl: Kernl;
};
