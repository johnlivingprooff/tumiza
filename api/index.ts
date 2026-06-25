import { handle } from "@hono/node-server/vercel";
import app from "./_lib/trpc-only.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handle(app);
