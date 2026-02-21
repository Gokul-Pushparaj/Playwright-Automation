import { test, expect } from '@playwright/test';

const WEBHOOK_ENDPOINT = process.env.JIRA_WEBHOOK_ENDPOINT ?? 'http://localhost:3000/webhook/jira';

/**
 * Try to read response as JSON, otherwise fallback to text.
 */
async function readResponseContent(response: Awaited<ReturnType<import('@playwright/test').APIRequestContext['post']>>) {
  let text: string;
  try {
    // attempt JSON first
    const json = await response.json();
    text = JSON.stringify(json);
  } catch {
    // fallback to plain text
    text = await response.text();
  }
  return text;
}

test.describe('Jira webhook - invalid payload handling', () => {
  test('should respond with client error when body is empty (JSON parse error)', async ({ request }) => {
    const response = await request.post(WEBHOOK_ENDPOINT, {
      headers: { 'content-type': 'application/json' },
      data: '' // intentionally empty body to simulate JSON parse error: "Expecting value"
    });

    // Expect a 4xx client error (server should reject invalid JSON)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const content = (await readResponseContent(response)).toLowerCase();

    // The service is expected to indicate a JSON parsing failure.
    // Be lenient about exact wording but assert that it reports a parse error.
    expect(
      content.includes('expecting value') ||
      content.includes('failed to parse') ||
      content.includes('invalid json') ||
      content.includes('invalid payload')
    ).toBeTruthy();
  });

  test('should respond with client error when body contains malformed JSON', async ({ request }) => {
    const malformed = '{ "issue": { "id": 123, "key": "ABC-1" '; // missing closing braces

    const response = await request.post(WEBHOOK_ENDPOINT, {
      headers: { 'content-type': 'application/json' },
      data: malformed
    });

    // Expect a 4xx client error (server should reject malformed JSON)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const content = (await readResponseContent(response)).toLowerCase();

    // Assert the response surfaces a parsing error message
    expect(
      content.includes('expecting value') ||
      content.includes('failed to parse') ||
      content.includes('invalid json') ||
      content.includes('malformed') ||
      content.includes('unexpected')
    ).toBeTruthy();
  });
});