/**
 * Token Usage Tracker - Development Stub
 *
 * This is a no-op stub for the planned per-consultant token tracking system.
 * The full implementation will persist token usage to the database so that
 * usage costs can be attributed to individual consultants / clients.
 *
 * Replace this with a real DB-backed implementation before monetizing AI usage.
 */
export interface TrackUsageParams {
  consultantId: string;
  clientId?: string;
  model: string;
  feature: string;
  requestType: string;
  keySource: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  thinkingTokens?: number;
  totalTokens: number;
  durationMs: number;
  hasTools?: boolean;
  hasFileSearch?: boolean;
  error?: boolean;
  callerRole?: string;
  isImageOutput?: boolean;
}

export const tokenTracker = {
  async track(_params: TrackUsageParams): Promise<void> {
    // no-op stub — real implementation will write to DB
  },
};
