
-- Add multiple favicon URL columns to global_seo_settings table
ALTER TABLE "global_seo_settings" 
ADD COLUMN IF NOT EXISTS "favicon_16_url" varchar(255),
ADD COLUMN IF NOT EXISTS "favicon_32_url" varchar(255),
ADD COLUMN IF NOT EXISTS "apple_touch_icon_url" varchar(255),
ADD COLUMN IF NOT EXISTS "android_chrome_192_url" varchar(255),
ADD COLUMN IF NOT EXISTS "android_chrome_512_url" varchar(255);
