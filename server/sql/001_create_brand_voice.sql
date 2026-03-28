CREATE TABLE IF NOT EXISTS brand_voice (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_info JSONB DEFAULT '{}',
  authority_positioning JSONB DEFAULT '{}',
  services_guarantees JSONB DEFAULT '{}',
  credentials_results JSONB DEFAULT '{}',
  voice_style JSONB DEFAULT '{}',
  market_research JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT brand_voice_tenant_unique UNIQUE (tenant_id)
);
