import { test, expect } from '@playwright/test';

test.describe('Enrollment Flow - Example Insurance App', () => {
  const BASE_URL = 'https://health.policybazaar.com';

  test('Happy path E2E: complete enrollment end-to-end', async ({ page }) => {
    // 1. Open landing page
    await page.goto(BASE_URL);
    // Ensure enroll entry point is visible
    const enrollButton = page.getByRole('button', { name: /enroll|start enrollment|get started/i });
    await expect(enrollButton).toBeVisible();
    await enrollButton.click();

    // 2. Personal Information screen
    // Assert navigation to personal info by presence of First name field
    const firstNameField = page.getByLabel('First name');
    await expect(firstNameField).toBeVisible();
    await firstNameField.fill('Alex');
    await page.getByLabel('Last name').fill('Morgan');
    await page.getByLabel('Email').fill('alex.morgan+e2e@example.com');
    await page.getByLabel('Date of birth').fill('1990-05-15');

    // screenshot of personal info
    await page.screenshot({ path: 'personal-information.png', fullPage: true });

    // Continue to next step
    await page.getByRole('button', { name: /continue|next/i }).click();

    // 3. Coverage selection screen
    const coverageHeading = page.getByRole('heading', { name: /coverage|select your plan/i });
    await expect(coverageHeading).toBeVisible();
    // Select Premium plan (happy path)
    const premiumRadio = page.getByRole('radio', { name: /premium/i });
    await expect(premiumRadio).toBeVisible();
    await premiumRadio.check();

    // screenshot of coverage selection
    await page.screenshot({ path: 'coverage-selection.png', fullPage: true });

    await page.getByRole('button', { name: /continue|next/i }).click();

    // 4. Integrations or Add-ons screen (optional step before review)
    // If there's an integrations step, skip or accept defaults.
    const integrationsHeading = page.getByRole('heading', { name: /integration|add-ons|integrations/i });
    if (await integrationsHeading.isVisible()) {
      // capture integrations screen
      await page.screenshot({ path: 'integrations.png', fullPage: true });
      // Assume default selections are fine; continue
      await page.getByRole('button', { name: /continue|next/i }).click();
    }

    // 5. Review and submit
    const reviewHeading = page.getByRole('heading', { name: /review|review and submit/i });
    await expect(reviewHeading).toBeVisible();
    // Capture review screenshot
    await page.screenshot({ path: 'review.png', fullPage: true });

    // Submit enrollment
    await page.getByRole('button', { name: /submit|submit enrollment/i }).click();

    // 6. Success screen
    const successMessage = page.getByText(/thank you|enrollment submitted|submission received/i);
    await expect(successMessage).toBeVisible();
    await expect(page).toHaveURL(/.*(confirmation|success|submitted).*/i);

    // Capture final success screenshot
    await page.screenshot({ path: 'enrollment-success.png', fullPage: true });
  });

  test('Negative validation: Jira webhook invalid JSON shows parse error', async ({ page }) => {
    // 1. Navigate to enrollment start
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /enroll|start enrollment|get started/i }).click();

    // 2. Fill just enough info to reach integrations step
    await page.getByLabel('First name').fill('Casey');
    await page.getByLabel('Last name').fill('Tester');
    await page.getByLabel('Email').fill('casey.tester+neg@example.com');
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Coverage selection - choose basic to proceed quickly
    const basicRadio = page.getByRole('radio', { name: /basic/i });
    if (await basicRadio.isVisible()) {
      await basicRadio.check();
      await page.getByRole('button', { name: /continue|next/i }).click();
    }

    // 3. Reach Integrations step (explicitly navigate if present)
    const integrationsHeading = page.getByRole('heading', { name: /integration|integrations/i });
    await expect(integrationsHeading).toBeVisible();

    // Click to add Jira integration
    const addJiraButton = page.getByRole('button', { name: /add jira integration|add jira|connect jira/i });
    await expect(addJiraButton).toBeVisible();
    await addJiraButton.click();

    // 4. Jira Integration modal/form should appear
    const modalHeading = page.getByRole('heading', { name: /jira integration|configure jira/i });
    await expect(modalHeading).toBeVisible();

    // Fill required fields with valid-ish values except the webhook payload
    await page.getByLabel('Integration name').fill('Jira - Test Project');
    await page.getByLabel('Webhook URL').fill('https://hooks.example.com/jira/test');

    // Intentionally provide invalid JSON to trigger "Failed to parse Jira webhook" / "JSON error: Expecting value"
    // Example invalid JSON: missing value after key
    const invalidJson = '{ "project": }';
    await page.getByLabel('Webhook Payload').fill(invalidJson);

    // Capture before validation
    await page.screenshot({ path: 'jira-webhook-invalid-payload.png', fullPage: true });

    // Click Validate or Save which triggers JSON parsing on UI
    const validateButton = page.getByRole('button', { name: /validate|save|test connection/i });
    await expect(validateButton).toBeVisible();
    await validateButton.click();

    // Expect a parse error notification/message to appear
    const parseError = page.getByText(/failed to parse jira webhook|json error: expecting value/i);
    await expect(parseError).toBeVisible();

    // Capture screenshot of the error state
    await page.screenshot({ path: 'jira-webhook-parse-error.png', fullPage: true });

    // Also assert that the integration was not accepted/saved (Save/Done button disabled or modal still open)
    // Check modal still visible
    await expect(modalHeading).toBeVisible();

    // If there is a specific inline field error for the payload, assert it's visible
    const payloadFieldError = page.getByText(/invalid json|invalid payload|expecting value/i);
    if (await payloadFieldError.isVisible()) {
      await expect(payloadFieldError).toBeVisible();
    }
  });
});