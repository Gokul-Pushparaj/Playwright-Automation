import { test, expect } from '@playwright/test';

test.describe('Jira webhook parsing', () => {
  test('returns a clear error when webhook JSON is malformed', async ({ request, baseURL }) => {
    // Use baseURL from Playwright config if provided, otherwise fall back to localhost.
    const endpoint =
      (baseURL ? `${baseURL.replace(/\/$/, '')}` : 'http://localhost:3000') + '/api/jira/webhook';

    // Malformed / empty JSON to simulate "Expecting value" parsing error.
    // An empty string or a single brace are common causes for "Expecting value".
    const malformedPayload = ''; // try '' or '{' if needed

    const response = await request.post(endpoint, {
      headers: { 'content-type': 'application/json' },
      data: malformedPayload,
    });

    // Expect a client error status code (4xx). Adjust if your service returns a different code.
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    // Server should return a helpful error message that includes both high-level and parser details.
    const bodyText = await response.text();
    expect(bodyText).toContain('Failed to parse Jira webhook');
    expect(bodyText).toContain('JSON error: Expecting value');
  });
});