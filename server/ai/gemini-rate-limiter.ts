export async function rateLimitedGeminiCall<T>(
  fn: () => Promise<T>,
  _options?: { context?: string }
): Promise<T> {
  return fn();
}
