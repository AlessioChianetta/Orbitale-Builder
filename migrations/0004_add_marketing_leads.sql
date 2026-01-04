
-- Add marketing_leads table for Google Sheets integration
CREATE TABLE IF NOT EXISTS "marketing_leads" (
  "id" serial PRIMARY KEY NOT NULL,
  "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "business_name" varchar(255),
  "first_name" varchar(255),
  "last_name" varchar(255),
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "source" varchar(100) DEFAULT 'google-sheets',
  "campaign" varchar(100) NOT NULL,
  "additional_data" jsonb,
  "status" varchar(50) DEFAULT 'new',
  "email_sent" boolean DEFAULT false,
  "whatsapp_sent" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "marketing_leads_tenant_idx" ON "marketing_leads" ("tenant_id");
CREATE INDEX IF NOT EXISTS "marketing_leads_campaign_idx" ON "marketing_leads" ("campaign");
CREATE INDEX IF NOT EXISTS "marketing_leads_email_idx" ON "marketing_leads" ("email");
