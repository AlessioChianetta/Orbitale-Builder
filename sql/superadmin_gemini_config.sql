-- Tabella per la configurazione API Gemini del Super Admin
-- Creata manualmente con SQL diretto (come da istruzioni progetto)
-- Eseguire questo script una volta sul DB di produzione

CREATE TABLE IF NOT EXISTS superadmin_gemini_config (
  id SERIAL PRIMARY KEY,
  api_keys_encrypted TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
