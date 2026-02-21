import { test, expect, APIResponse, Page } from '@playwright/test';

const DEFAULT_WEBHOOK_PATH = '/api/webhooks/jira';
const WEBHOOK_LOGS_ROUTE = '/webhooks/logs';

// Utility: send a POST with deliberately malformed JSON to simulate the failing Jira webhook
async function postMalformedJiraWebhook(requestContext: Parameters<typeof test>[0]['request'], webhookPath: string): Promise<APIResponse> {
  // Deliberately invalid JSON payload: empty string (common case that triggers "Expecting value")
  const malformedBody = ''; // other options: '{', 'invalid', 'null\n,' etc.
  return await requestContext.post(webhookPath, {
    headers: {
      'Content-Type': 'application/json',
      // Additional headers Jira might send, if your server uses them for routing/auth:
      'X-Event-Key': 'jira:issue_updated',
      'User-Agent': 'Atlassian-Webhooks/2.0',
    },
    data: malformedBody,
  });
}

// Helper: navigate to webhook logs and assert the latest record contains the expected error message
async function assertWebhookLogContains(page: Page, baseURL: string, expectedText: string) {
  await page.goto(`${baseURL}${WEBHOOK_LOGS_ROUTE}`, { waitUntil: 'networkidle' });

  // Wait for logs to appear - adapt selector as needed for your application
  const logContainer = page.locator('role=main').locator('text=Webhook').first().locator('..'); // resilient attempt
  // More direct fallback: look for the error text anywhere on the page
  const errorLocator = page.locator(`text=${expectedText}`);

  // Wait for either the specific container or the error text to appear
  await Promise.race([
    logContainer.waitFor({ timeout: 5000 }).catch(() => null),
    errorLocator.waitFor({ timeout: 5000 }).catch(() => null),
  ]);

  await expect(errorLocator).toHaveCountGreaterThan(0);
}

test.describe('Jira webhook parsing error handling', () => {
  test('returns 400 and surfaces "JSON error: Expecting value" in webhook logs for malformed payload', async ({ request, page, baseURL }) => {
    test.slow(); // mark as potentially slower because of navigation to logs

    const webhookPath = process.env.JIRA_WEBHOOK_ENDPOINT || DEFAULT_WEBHOOK_PATH;

    // Step 1: POST malformed payload to the webhook endpoint
    let response: APIResponse;
    await test.step('Send malformed Jira webhook payload', async () => {
      response = await postMalformedJiraWebhook(request, webhookPath);
      // Assert server responded with a client error (400 series). Exact status may vary (400/422) depending on implementation.
      const status = response.status();
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    // Step 2: Assert the response contains a JSON parsing error string if available
    await test.step('Assert response contains JSON parsing error message', async () => {
      // Try to read text safely (response might be JSON or plain text)
      let textBody: string;
      try {
        textBody = await response.text();
      } catch {
        textBody = '';
      }

      // The system under test described the error as "JSON error: Expecting value"
      // Accept any casing or partial match to be resilient
      const expectedSnippet = 'Expecting value';
      expect(textBody).toContain(expectedSnippet);
    });

    // Step 3: Verify the UI surfaces the parsing failure in webhook logs
    await test.step('Verify webhook logs show parsing failure', async () => {
      if (!baseURL) {
        // If baseURL is not provided by Playwright config, require it via env var for UI check
        throw new Error('baseURL is not configured. Set playwright config baseURL or provide env var BASE_URL.');
      }

      // Ensure we're authenticated if your logs are behind auth. This example assumes public or sessionless logs.
      // If authentication is required, add login steps here using page.goto + form fill.

      // The expected visible message (adapt as needed)
      const visibleExpected = 'Failed to parse Jira webhook';
      const snippet = 'Expecting value';

      // First try to find a combined message, fall back to snippet only
      try {
        await assertWebhookLogContains(page, baseURL, `${visibleExpected}`);
      } catch {
        // Fall back: check for the parsing snippet anywhere on the page
        await assertWebhookLogContains(page, baseURL, snippet);
      }
    });
  });
});