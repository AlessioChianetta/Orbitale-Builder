const SENSITIVE_FIELDS = [
  'password',
  'googleSheetsApiKey',
  'telegramBotToken',
  'telegramChatId',
];

export function sanitizeUserForResponse(user: Record<string, any>): Record<string, any> {
  const sanitized = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

const SENSITIVE_KEYS_RE = /password|token|apiKey|secret|authorization|credential/i;

export function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveFields);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS_RE.test(key) && typeof value === 'string') {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
