import crypto from 'crypto';

export type ApiKeyEnvironment = 'live' | 'test';

export interface GenerateApiKeyOptions {
  environment?: ApiKeyEnvironment;
  length?: number;
}

export function generateApiKey(options: GenerateApiKeyOptions = {}): string {
  const {
    environment = 'live',
    length = 32
  } = options;

  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  const randomString = randomBytes.toString('hex').slice(0, length);
  
  const prefix = environment === 'live' ? 'crm_live_' : 'crm_test_';
  
  return `${prefix}${randomString}`;
}

export function validateApiKeyFormat(key: string): boolean {
  const validPrefixes = ['crm_live_', 'crm_test_'];
  const hasValidPrefix = validPrefixes.some(prefix => key.startsWith(prefix));
  
  if (!hasValidPrefix) {
    return false;
  }

  const minTotalLength = 32;
  return key.length >= minTotalLength;
}

export function getApiKeyEnvironment(key: string): ApiKeyEnvironment | null {
  if (key.startsWith('crm_live_')) {
    return 'live';
  }
  if (key.startsWith('crm_test_')) {
    return 'test';
  }
  return null;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) {
    return '***';
  }
  
  const prefix = key.startsWith('crm_live_') ? 'crm_live_' : 
                 key.startsWith('crm_test_') ? 'crm_test_' : '';
  
  const lastChars = key.slice(-4);
  const maskedMiddle = '*'.repeat(11);
  
  return `${prefix}${maskedMiddle}${lastChars}`;
}
