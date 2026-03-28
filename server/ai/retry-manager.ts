export interface AiProviderMetadata {
  name: string;
  managedBy?: string;
  expiresAt?: Date | string;
  keySource?: string;
  [key: string]: unknown;
}
