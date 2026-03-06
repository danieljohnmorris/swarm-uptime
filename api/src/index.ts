import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { db, runMigrations } from "./db/index.js";
import { monitors, checks } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";
import { checksQueue } from "./queue.js";
import { startScheduler } from "./scheduler.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/monitors", async (c) => {
  const result = await db.select().from(monitors).orderBy(monitors.name);
  return c.json(result);
});

app.post("/monitors", async (c) => {
  const body = await c.req.json();
  const { name, url, interval } = body;

  if (!name || !url) {
    return c.json({ error: "name and url are required" }, 400);
  }

  const [monitor] = await db
    .insert(monitors)
    .values({ name, url, interval: interval || 60 })
    .returning();

  return c.json(monitor, 201);
});

app.delete("/monitors/:id", async (c) => {
  const id = Number(c.req.param("id"));

  await db.delete(checks).where(eq(checks.monitorId, id));
  await db.delete(monitors).where(eq(monitors.id, id));

  return c.json({ ok: true });
});

app.get("/monitors/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, id));

  if (!monitor) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json(monitor);
});

app.get("/monitors/:id/checks", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .select()
    .from(checks)
    .where(eq(checks.monitorId, id))
    .orderBy(desc(checks.checkedAt))
    .limit(50);

  return c.json(result);
});

async function start() {
  await runMigrations();

  serve({ fetch: app.fetch, port: 3001 }, (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  });

  startScheduler();
}

start();
