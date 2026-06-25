/**
 * Vercel Serverless Function entry point.
 *
 * Vercel's Node.js runtime calls this file's default export with
 * (req, res). We bridge that into the Hono app's fetch-based interface
 * via @hono/node-server's getConnInfo helper.
 *
 * File lives at api/vercel/index.ts → Vercel maps it to /api/*
 */

import { handle } from "@hono/node-server/vercel";
import app from "../boot";

export const config = {
  api: {
    bodyParser: false, // Hono reads the raw stream itself
  },
};

export default handle(app);
