import { handle } from "@hono/node-server/vercel";
import app from "./_lib/boot";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handle(app);
