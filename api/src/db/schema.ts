import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const monitors = pgTable("monitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  interval: integer("interval").default(60).notNull(),
  status: text("status").default("unknown").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id")
    .references(() => monitors.id)
    .notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time").notNull(),
  status: text("status").notNull(), // 'up' | 'down' | 'error'
  message: text("message"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});
