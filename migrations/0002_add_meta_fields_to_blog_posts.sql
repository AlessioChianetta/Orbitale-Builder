
-- Add missing SEO fields to blog_posts table
ALTER TABLE "blog_posts" ADD COLUMN "meta_title" varchar(60);
ALTER TABLE "blog_posts" ADD COLUMN "meta_description" varchar(160);
