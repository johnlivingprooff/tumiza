/**
 * Netlify Function entry point.
 *
 * Netlify Functions v2 use a fetch-based handler signature, which maps
 * directly onto Hono's app.fetch — no adapter layer needed.
 *
 * Netlify routes all /api/* requests here via netlify.toml [[redirects]].
 */

import app from "../../api/_lib/boot";

export default async (request: Request) => {
  return app.fetch(request);
};

export const config = {
  path: "/api/*",
};
