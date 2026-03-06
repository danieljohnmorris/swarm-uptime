CREATE TABLE "checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"status_code" integer,
	"response_time" integer NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"interval" integer DEFAULT 60 NOT NULL,
	"status" text DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE no action ON UPDATE no action;