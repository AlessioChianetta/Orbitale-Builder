
-- Aggiungi campi mancanti a marketing_leads (se non esistono già)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='business_name') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "business_name" varchar(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='first_name') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "first_name" varchar(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='last_name') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "last_name" varchar(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='additional_data') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "additional_data" jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='email_sent') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "email_sent" boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketing_leads' AND column_name='whatsapp_sent') THEN
    ALTER TABLE "marketing_leads" ADD COLUMN "whatsapp_sent" boolean DEFAULT false;
  END IF;
END $$;

-- Tabella per le configurazioni Google Sheets
CREATE TABLE IF NOT EXISTS "google_sheets_campaigns" (
  "id" serial PRIMARY KEY NOT NULL,
  "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "campaign_name" varchar(100) NOT NULL,
  "sheet_id" varchar(255) NOT NULL,
  "sheet_range" varchar(100) DEFAULT 'A:Z',
  "is_active" boolean DEFAULT true,
  "last_sync" timestamp,
  "sync_frequency" varchar(50) DEFAULT 'manual',
  "mapping_config" jsonb,
  "client_id" integer,
  "owner_id" integer,
  "archived" boolean DEFAULT false,
  "email_template" varchar(100) DEFAULT 'movieturbo',
  "max_leads_per_sync" integer DEFAULT 10,
  "sync_interval_minutes" integer DEFAULT 10,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indici per google_sheets_campaigns
CREATE INDEX IF NOT EXISTS "google_sheets_campaigns_tenant_idx" ON "google_sheets_campaigns" ("tenant_id");
CREATE INDEX IF NOT EXISTS "google_sheets_campaigns_campaign_idx" ON "google_sheets_campaigns" ("campaign_name");
CREATE INDEX IF NOT EXISTS "google_sheets_campaigns_client_idx" ON "google_sheets_campaigns" ("client_id");

-- Tabella per i clienti
CREATE TABLE IF NOT EXISTS "clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "owner_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "clients_owner_idx" ON "clients" ("owner_id");

-- Tabella per tracciare i sync log
CREATE TABLE IF NOT EXISTS "google_sheets_sync_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "campaign_id" integer REFERENCES "google_sheets_campaigns"("id") ON DELETE CASCADE,
  "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "sync_status" varchar(50) DEFAULT 'pending',
  "leads_imported" integer DEFAULT 0,
  "leads_failed" integer DEFAULT 0,
  "error_message" text,
  "sync_started_at" timestamp DEFAULT now() NOT NULL,
  "sync_completed_at" timestamp
);

-- Indici per sync_log
CREATE INDEX IF NOT EXISTS "google_sheets_sync_log_campaign_idx" ON "google_sheets_sync_log" ("campaign_id");
CREATE INDEX IF NOT EXISTS "google_sheets_sync_log_tenant_idx" ON "google_sheets_sync_log" ("tenant_id");

-- Aggiungi indice per email in marketing_leads se non esiste
CREATE INDEX IF NOT EXISTS "marketing_leads_status_idx" ON "marketing_leads" ("status");
