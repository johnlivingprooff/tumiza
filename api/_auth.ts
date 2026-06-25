import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { createLoginHandler } from "./_lib/local-auth";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use(
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

app.post("/api/auth/login", createLoginHandler());

app.all("*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
