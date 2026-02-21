import { test, expect } from '@playwright/test';

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3000/webhooks/jira';

test.describe('Jira webhook parsing', () => {
  test('returns a 4xx and a descriptive error when payload is invalid JSON', async ({ request }) => {
    // Intentionally malformed JSON that will trigger a parser error on the server.
    const invalidJson = '}{';

    const response = await request.post(WEBHOOK_URL, {
      data: invalidJson,
      headers: {
        'content-type': 'application/json',
        // Add a common Jira webhook user-agent to simulate a real webhook sender (optional).
        'user-agent': 'Atlassian-Webhooks/1.0',
      },
    });

    // Expect a client error (4xx) for invalid payloads.
    const status = response.status();
    expect(status, `expected 4xx response but received ${status}`).toBeGreaterThanOrEqual(400);
    expect(status, `expected 4xx response but received ${status}`).toBeLessThan(500);

    // The service should return a helpful error message indicating a parse problem.
    const bodyText = await response.text();

    // Accept either a plain text message or a JSON body that contains the error details.
    // Check for the presence of both a parse-related message and the phrase "Expecting value".
    expect(
      bodyText,
      'response body should mention a parsing failure for Jira payloads'
    ).toMatch(/(parse|parsing|failed).*jira|jira.*(parse|parsing|failed)/i);
    expect(bodyText, 'response body should include the JSON parser error "Expecting value"').toMatch(
      /Expecting value/i
    );
  });

  test('accepts valid Jira webhook payloads (sanity check)', async ({ request }) => {
    // A minimal, valid-looking Jira webhook payload.
    const validPayload = {
      webhookEvent: 'jira:issue_updated',
      issue: {
        id: '10001',
        key: 'PROJ-1',
        fields: {
          summary: 'Example issue',
        },
      },
    };

    const response = await request.post(WEBHOOK_URL, {
      data: JSON.stringify(validPayload),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Atlassian-Webhooks/1.0',
      },
    });

    // For valid payloads expect a successful response (2xx).
    const status = response.status();
    expect(status, `expected 2xx response but received ${status}`).toBeGreaterThanOrEqual(200);
    expect(status, `expected 2xx response but received ${status}`).toBeLessThan(300);

    // Optionally ensure the service returns a success confirmation.
    const body = await response.text();
    expect(body.length, 'response body should not be empty').toBeGreaterThan(0);
  });
});