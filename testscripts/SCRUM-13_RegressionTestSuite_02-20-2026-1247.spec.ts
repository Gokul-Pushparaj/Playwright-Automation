import { test, expect } from '@playwright/test';

/**
 * Minimal Jira webhook parser used solely for testing webhook JSON handling.
 * - Returns parsed object for valid JSON
 * - Throws Error('JSON error: Expecting value') for empty, null/undefined, or malformed JSON
 *
 * Note: This parser is intentionally small and deterministic to match the Jira story:
 * "Failed to parse Jira webhook" / "JSON error: Expecting value"
 */
function parseJiraWebhook(raw: string | null | undefined): any {
  if (raw === null || raw === undefined) {
    throw new Error('JSON error: Expecting value');
  }
  if (raw.trim() === '') {
    throw new Error('JSON error: Expecting value');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('JSON error: Expecting value');
  }
}

test.describe('Jira webhook JSON parsing - based on story: "Failed to parse Jira webhook"', () => {
  test('Happy path: parses a valid Jira webhook JSON payload', async () => {
    const payload = JSON.stringify({
      issue: {
        key: 'PROJ-123',
        fields: {
          summary: 'Sample webhook received',
        },
      },
      webhookEvent: 'jira:issue_updated',
    });

    const parsed = parseJiraWebhook(payload);

    expect(parsed).toBeTruthy();
    expect(parsed.issue).toBeDefined();
    expect(parsed.issue.key).toBe('PROJ-123');
    expect(parsed.issue.fields.summary).toBe('Sample webhook received');
    expect(parsed.webhookEvent).toBe('jira:issue_updated');
  });

  test('Negative: empty string payload triggers "JSON error: Expecting value"', async () => {
    await expect(() => parseJiraWebhook('')).toThrowError('JSON error: Expecting value');
  });

  test('Negative: null payload triggers "JSON error: Expecting value"', async () => {
    await expect(() => parseJiraWebhook(null)).toThrowError('JSON error: Expecting value');
  });

  test('Negative: whitespace-only payload triggers "JSON error: Expecting value"', async () => {
    await expect(() => parseJiraWebhook('   \n\t')).toThrowError('JSON error: Expecting value');
  });

  test('Negative: malformed JSON payload triggers "JSON error: Expecting value"', async () => {
    const malformed = '{"issue": {"key": "PROJ-123", "fields": { "summary": "oops", } }'; // trailing comma / broken
    await expect(() => parseJiraWebhook(malformed)).toThrowError('JSON error: Expecting value');
  });

  test('Negative: non-JSON text payload triggers "JSON error: Expecting value"', async () => {
    const text = 'this is not json';
    await expect(() => parseJiraWebhook(text)).toThrowError('JSON error: Expecting value');
  });
});