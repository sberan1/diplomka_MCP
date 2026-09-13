ALTER TABLE "course_pages" ADD COLUMN "completion_form" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "teaching_form" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "aims" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "learning_outcomes" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "course_contents" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "workload_summary" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "assessment_methods" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "special_requirements" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "literature" text;--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "course_pages" ADD CONSTRAINT "course_pages_version_id_course_pages_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."course_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_pages_version_id_idx" ON "course_pages" USING btree ("version_id");