
-- Add favicon_url column to global_seo_settings table
ALTER TABLE "global_seo_settings" 
ADD COLUMN IF NOT EXISTS "favicon_url" varchar(255);
