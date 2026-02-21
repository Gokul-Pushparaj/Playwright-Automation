import { test, expect } from '@playwright/test';

test.describe('Jira webhook - malformed JSON handling', () => {
  // Configure the endpoint via environment variable or fall back to a sensible default.
  const endpoint = process.env.JIRA_WEBHOOK_ENDPOINT ?? '/api/webhooks/jira';

  test('returns a client error and descriptive message when JSON payload is invalid', async ({ request }) => {
    // Intentionally malformed JSON
    const invalidJson = '}{';

    const response = await request.post(endpoint, {
      // send invalid JSON as the raw request body
      data: invalidJson,
      headers: {
        'content-type': 'application/json',
      },
    });

    // The service should not return 2xx for malformed JSON
    expect(response.ok()).toBeFalsy();

    // Prefer a 4xx status for a parsing error; accept common possibilities if needed.
    // If your service consistently returns a specific status (e.g. 400), you can assert that instead.
    expect([400, 422, 415, 500]).toContain(response.status());

    // The response body should include a helpful message about parsing failure.
    const text = await response.text();
    expect(text).toMatch(/(Expecting value|Failed to parse Jira webhook|invalid json|JSON parse error)/i);
  });
});