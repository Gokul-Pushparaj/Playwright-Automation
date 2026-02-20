import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Jira webhook - invalid JSON handling', () => {
  test('returns 400 and descriptive error for empty request body (JSON parse failure)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/webhooks/jira`, {
      headers: { 'content-type': 'application/json' },
      // send an empty body which commonly triggers "Expecting value" JSON parse errors
      body: '',
    });

    // Expecting the service to reject invalid JSON with a client error status
    expect(res.status(), 'expected 400-level status for invalid JSON').toBeGreaterThanOrEqual(400);
    expect(res.status(), 'expected 400-level status for invalid JSON').toBeLessThan(500);

    // The API might return JSON or plain text. Normalize to a string and assert key substrings.
    const text = await res.text();
    expect(text, 'error response should mention JSON parsing problem').toMatch(/json error/i);
    expect(text, 'error response should include "Expecting value"').toMatch(/expecting value/i);
  });

  test('returns 400 and descriptive error for malformed JSON payload', async ({ request }) => {
    // Example of malformed JSON (trailing comma)
    const malformed = '{ "issueKey": "ABC-123", }';

    const res = await request.post(`${BASE_URL}/webhooks/jira`, {
      headers: { 'content-type': 'application/json' },
      body: malformed,
    });

    expect(res.status(), 'expected 400-level status for malformed JSON').toBeGreaterThanOrEqual(400);
    expect(res.status(), 'expected 400-level status for malformed JSON').toBeLessThan(500);

    const text = await res.text();
    expect(text, 'error response should mention JSON parsing problem').toMatch(/json error/i);
    // Some JSON parsers report "Expecting value" for certain malformed inputs; check for that phrase as well.
    expect(text, 'error response should include "Expecting value" or other parse indicator').toMatch(/expecting value|unexpected token|parse error/i);
  });
});