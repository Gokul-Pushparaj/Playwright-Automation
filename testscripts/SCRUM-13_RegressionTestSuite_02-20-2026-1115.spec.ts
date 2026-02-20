import { test, expect } from '@playwright/test';

const BASE_URL = 'https://example-insurance-app.com';

test.describe('Enrollment flow', () => {
  test('Happy path E2E flow - complete enrollment', async ({ page }) => {
    // Landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('button', { name: /start enrollment/i })).toBeVisible();
    await page.screenshot({ path: 'screens/landing.png', fullPage: true });

    // Start enrollment
    await page.getByRole('button', { name: /start enrollment/i }).click();
    // Assert transition to Personal Information
    const personalHeader = page.getByRole('heading', { name: /personal information/i });
    await expect(personalHeader).toBeVisible();
    await page.screenshot({ path: 'screens/personal-information.png', fullPage: true });

    // Fill personal information
    await page.getByLabel(/first\s*name/i).fill('John');
    await page.getByLabel(/last\s*name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/date of birth|dob/i).fill('1985-06-15');
    await page.getByRole('button', { name: /next/i }).click();

    // Coverage selection
    const coverageHeader = page.getByRole('heading', { name: /coverage selection/i });
    await expect(coverageHeader).toBeVisible();
    await page.screenshot({ path: 'screens/coverage-selection.png', fullPage: true });

    // Choose a plan and addons
    // Prefer label selectors for radio/checkbox
    await page.getByLabel(/comprehensive plan/i).check();
    await page.getByLabel(/roadside assistance/i).check();
    await page.getByRole('button', { name: /next/i }).click();

    // Review & Submit
    const reviewHeader = page.getByRole('heading', { name: /review & submit/i });
    await expect(reviewHeader).toBeVisible();
    // Verify summary contains key values
    await expect(page.getByText(/john doe/i)).toBeVisible();
    await expect(page.getByText(/comprehensive plan/i)).toBeVisible();
    await page.screenshot({ path: 'screens/review-and-submit.png', fullPage: true });

    // Submit enrollment
    await page.getByRole('button', { name: /submit enrollment|submit/i }).click();

    // Confirmation
    const confirmationHeader = page.getByRole('heading', { name: /enrollment confirmation|confirmation/i });
    await expect(confirmationHeader).toBeVisible();
    await expect(page.getByText(/thank you|submitted successfully/i)).toBeVisible();
    await page.screenshot({ path: 'screens/confirmation.png', fullPage: true });
  });

  test('Negative validation scenario - invalid Jira webhook JSON shows error', async ({ page }) => {
    // Start from landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('button', { name: /start enrollment/i })).toBeVisible();
    await page.getByRole('button', { name: /start enrollment/i }).click();

    // Fill minimal personal information to progress
    await expect(page.getByRole('heading', { name: /personal information/i })).toBeVisible();
    await page.getByLabel(/first\s*name/i).fill('Alice');
    await page.getByLabel(/last\s*name/i).fill('Smith');
    await page.getByLabel(/email/i).fill('alice.smith@example.com');
    await page.getByRole('button', { name: /next/i }).click();

    // Select a basic plan
    await expect(page.getByRole('heading', { name: /coverage selection/i })).toBeVisible();
    await page.getByLabel(/basic plan/i).check().catch(() => {
      // If "Basic Plan" label isn't present in the mocks, try a generic radio
      return page.getByRole('radio').first().check();
    });
    await page.getByRole('button', { name: /next/i }).click();

    // On Review page, navigate to Integrations / Configure Integrations
    await expect(page.getByRole('heading', { name: /review & submit/i })).toBeVisible();
    // Prefer role/text selector for navigation to integrations
    const configIntegrationsButton = page.getByRole('button', { name: /configure integrations|integrations/i });
    if (await configIntegrationsButton.isVisible()) {
      await configIntegrationsButton.click();
    } else {
      // Fallback: click a link that likely leads to Integrations
      await page.getByRole('link', { name: /integrations/i }).click().catch(() => null);
    }

    // Integrations page
    const integrationsHeader = page.getByRole('heading', { name: /integrations|integration settings/i });
    await expect(integrationsHeader).toBeVisible();
    await page.screenshot({ path: 'screens/integrations-empty.png', fullPage: true });

    // Locate the Jira webhook JSON textarea by label and enter invalid JSON
    const jiraWebhookField = page.getByLabel(/jira webhook|webhook payload|webhook json/i);
    await expect(jiraWebhookField).toBeVisible();
    await jiraWebhookField.fill('{ invalid_json: }'); // intentionally malformed

    // Attempt to test/save the webhook
    await page.getByRole('button', { name: /test webhook|save integration|save/i }).click();

    // Expect a validation error message indicating JSON parse error
    const jsonError = page.getByText(/expecting value/i);
    await expect(jsonError).toBeVisible();
    await page.screenshot({ path: 'screens/integrations-json-error.png', fullPage: true });

    // Additionally assert that the save/test button remains enabled (UI didn't crash)
    await expect(page.getByRole('button', { name: /test webhook|save integration|save/i })).toBeEnabled();
  });
});