import { db } from "../db";
import { superadminGeminiConfig } from "../../shared/schema";
import { decrypt } from "../encryption";

interface GeminiKeysResult {
  keys: string[];
  enabled: boolean;
}

let cache: { data: GeminiKeysResult; fetchedAt: number } | null = null;
const CACHE_TTL = 60_000;

export async function getSuperAdminGeminiKeys(): Promise<GeminiKeysResult | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const rows = await db.select().from(superadminGeminiConfig).limit(1);
    if (!rows.length || !rows[0].enabled) {
      cache = { data: { keys: [], enabled: false }, fetchedAt: Date.now() };
      return null;
    }

    const keys = JSON.parse(decrypt(rows[0].apiKeysEncrypted)) as string[];
    const result: GeminiKeysResult = { keys, enabled: true };
    cache = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GeminiKeys] Error fetching keys:", msg);
    return null;
  }
}

export async function pickGeminiApiKey(): Promise<string | null> {
  const result = await getSuperAdminGeminiKeys();
  if (result && result.keys.length > 0) {
    return result.keys[Math.floor(Math.random() * result.keys.length)];
  }
  return process.env.GEMINI_API_KEY || null;
}
