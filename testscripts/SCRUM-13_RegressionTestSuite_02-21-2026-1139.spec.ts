import { test, expect } from '@playwright/test';

test.describe('Webhook error handling - Jira parse failure', () => {
  test('displays parse error details when webhook JSON is invalid', async ({ page }) => {
    // Intercept the API call that fetches webhook events and return an event with a parse error.
    await page.route('**/api/webhooks/events**', async route => {
      const body = {
        events: [
          {
            id: 'evt-123',
            source: 'jira',
            status: 'failed',
            title: 'Failed to parse Jira webhook',
            error: 'JSON error: Expecting value',
            receivedAt: '2026-02-21T12:00:00Z'
          }
        ]
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // Navigate to the page in the app that lists webhook events.
    // Assumes baseURL is configured in Playwright config; adjust path if needed.
    await page.goto('/webhooks');

    // Wait for the mocked network call to complete so the UI has rendered the events.
    await page.waitForResponse(resp => resp.url().includes('/api/webhooks/events') && resp.status() === 200);

    // Assert the UI shows the event title and the parse error details.
    await expect(page.getByText('Failed to parse Jira webhook')).toBeVisible();
    await expect(page.getByText('JSON error: Expecting value')).toBeVisible();

    // Optionally assert that the event is marked as failed (common UI pattern).
    // This will match things like a "Failed" badge, label, or status text.
    await expect(page.getByText(/Failed/i)).toBeVisible();
  });
});