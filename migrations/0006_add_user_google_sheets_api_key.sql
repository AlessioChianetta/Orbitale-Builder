
-- Add Google Sheets API Key field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_sheets_api_key" text;

-- Add comment for documentation
COMMENT ON COLUMN "users"."google_sheets_api_key" IS 'Personal Google Sheets API Key for the user';
