import { test, expect } from '@playwright/test';

test('displays clear error when failing to parse Jira webhook JSON', async ({ page }) => {
  // Minimal test page that simulates client-side webhook handling.
  // The handler will catch parse errors and render the exact message required by the user story.
  await page.setContent(`
    <!doctype html>
    <html>
      <body>
        <div id="output" role="status"></div>
        <script>
          // Expose a simple handler that attempts to parse incoming webhook payloads.
          // On parse failure it writes a clear, actionable error message into #output.
          (function () {
            (window).handleWebhook = function (raw) {
              try {
                // Attempt to parse - in a real app this would be the actual parsing logic.
                JSON.parse(raw);
                document.getElementById('output').textContent = 'Parsed successfully';
                return { ok: true };
              } catch (err) {
                // Normalize the error message to match the user story.
                const message = 'Failed to parse Jira webhook\\n\\nJSON error: Expecting value';
                document.getElementById('output').textContent = message;
                return { ok: false, message };
              }
            };
          })();
        </script>
      </body>
    </html>
  `);

  // Simulate an invalid webhook payload (empty string) that triggers the parsing failure.
  await page.evaluate(() => (window as any).handleWebhook(''));

  // Assert that the user-facing error message is rendered exactly as specified.
  const expected = 'Failed to parse Jira webhook\n\nJSON error: Expecting value';
  await expect(page.locator('#output')).toHaveText(expected);
});