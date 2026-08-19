CREATE TYPE "public"."check_result" AS ENUM('ok', 'error', 'warning', 'cannot_verify');--> statement-breakpoint
CREATE TYPE "public"."page_language" AS ENUM('cs', 'en');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('error', 'recommendation', 'warning');--> statement-breakpoint
CREATE TABLE "course_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"language" "page_language" NOT NULL,
	"name" text NOT NULL,
	"teaching_language" text NOT NULL,
	"ects_credits" integer NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "report_rule_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"rule_id" integer NOT NULL,
	"result" "check_result" NOT NULL,
	"detail" text NOT NULL,
	CONSTRAINT "report_rule_evaluations_report_rule_unique" UNIQUE("report_id","rule_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "rule_type" NOT NULL,
	CONSTRAINT "rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "course_pages" ADD CONSTRAINT "course_pages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_rule_evaluations" ADD CONSTRAINT "report_rule_evaluations_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_rule_evaluations" ADD CONSTRAINT "report_rule_evaluations_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_pages_course_id_idx" ON "course_pages" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_pages_current_unique_idx" ON "course_pages" USING btree ("course_id","language") WHERE "course_pages"."is_current" = true;