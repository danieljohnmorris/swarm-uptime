import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const monitors = pgTable("monitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  interval: integer("interval").notNull().default(60),
  status: text("status").notNull().default("unknown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id")
    .notNull()
    .references(() => monitors.id),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  status: text("status").notNull(),
  message: text("message"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});
