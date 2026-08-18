CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
