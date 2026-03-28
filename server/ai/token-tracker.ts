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
  },
};
