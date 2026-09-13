ALTER TABLE "course_pages" DROP CONSTRAINT "course_pages_version_id_course_pages_id_fk";
--> statement-breakpoint
DROP INDEX "course_pages_version_id_idx";--> statement-breakpoint
DROP INDEX "course_pages_current_unique_idx";--> statement-breakpoint
ALTER TABLE "course_pages" ADD COLUMN "content_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "course_pages" DROP COLUMN "version_id";--> statement-breakpoint
ALTER TABLE "course_pages" DROP COLUMN "is_current";--> statement-breakpoint
ALTER TABLE "course_pages" ADD CONSTRAINT "course_pages_content_hash_unique" UNIQUE("content_hash");