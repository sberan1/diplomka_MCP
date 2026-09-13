ALTER TABLE "reports" DROP CONSTRAINT "reports_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "version_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_version_id_course_pages_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."course_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "course_id";