/**
 * Gemini Rate Limiter - Development Stub
 *
 * This is a pass-through stub for the planned rate limiting infrastructure.
 * The full implementation will enforce per-key RPM/TPM quotas to avoid
 * 429 errors across the 3-tier AI provider system.
 *
 * For now all calls are passed through without throttling.
 * Replace this with a real token-bucket implementation before going to
 * production with heavy AI load.
 */
export async function rateLimitedGeminiCall<T>(
  fn: () => Promise<T>,
  _options?: { context?: string }
): Promise<T> {
  return fn();
}
