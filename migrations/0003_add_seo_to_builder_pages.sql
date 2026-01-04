
-- Check if columns exist before adding them
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'builder_pages' AND column_name = 'meta_title') THEN
    ALTER TABLE builder_pages ADD COLUMN meta_title VARCHAR(60);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'builder_pages' AND column_name = 'meta_description') THEN
    ALTER TABLE builder_pages ADD COLUMN meta_description VARCHAR(160);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'builder_pages' AND column_name = 'og_image') THEN
    ALTER TABLE builder_pages ADD COLUMN og_image TEXT;
  END IF;
END $$;
