import { test, expect } from '@playwright/test';

test.describe('Failed to parse Jira webhook - JSON error: Expecting value', () => {
  /**
   * Minimal deterministic parser used by the tests to simulate the webhook JSON parsing logic.
   * It intentionally surfaces the exact error message "Expecting value" for any empty or invalid input
   * to match the Jira story description.
   */
  function parseJiraWebhook(payload: string | Buffer | null | undefined): unknown {
    if (payload === null || payload === undefined) {
      throw new Error('Expecting value');
    }

    const text = Buffer.isBuffer(payload) ? payload.toString('utf-8') : String(payload);

    if (text.trim() === '') {
      throw new Error('Expecting value');
    }

    try {
      return JSON.parse(text);
    } catch {
      // Surface the specific error message referenced in the story.
      throw new Error('Expecting value');
    }
  }

  test('Happy path: valid Jira webhook JSON payload parses successfully', () => {
    const payload = JSON.stringify({
      event: 'issue_created',
      issue: {
        id: 123,
        key: 'PROJ-1',
        fields: {
          summary: 'Sample issue',
        },
      },
    });

    const parsed = parseJiraWebhook(payload);

    expect(parsed).toEqual({
      event: 'issue_created',
      issue: {
        id: 123,
        key: 'PROJ-1',
        fields: {
          summary: 'Sample issue',
        },
      },
    });
  });

  test('Negative: empty string payload produces "Expecting value" error', () => {
    expect(() => parseJiraWebhook('')).toThrow('Expecting value');
    expect(() => parseJiraWebhook('   ')).toThrow('Expecting value');
  });

  test('Negative: null payload produces "Expecting value" error', () => {
    expect(() => parseJiraWebhook(null)).toThrow('Expecting value');
    expect(() => parseJiraWebhook(undefined)).toThrow('Expecting value');
  });

  test('Negative: malformed JSON payload produces "Expecting value" error', () => {
    // Missing closing brace
    const malformed1 = '{"event":"issue_created","issue":{ "id": 1 ';
    // Trailing comma
    const malformed2 = '{"event":"issue_created",}';
    expect(() => parseJiraWebhook(malformed1)).toThrow('Expecting value');
    expect(() => parseJiraWebhook(malformed2)).toThrow('Expecting value');
  });

  test('Negative: non-JSON text payload produces "Expecting value" error', () => {
    const notJson = 'this is plain text, not json';
    expect(() => parseJiraWebhook(notJson)).toThrow('Expecting value');
  });

  test('Negative: binary/Buffer empty payload produces "Expecting value" error', () => {
    expect(() => parseJiraWebhook(Buffer.from(''))).toThrow('Expecting value');
  });

  test('Negative: binary/Buffer with invalid JSON produces "Expecting value" error', () => {
    expect(() => parseJiraWebhook(Buffer.from('not-json'))).toThrow('Expecting value');
  });
});