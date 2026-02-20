import { test, expect } from '@playwright/test';

test.describe('Enrollment flow - Example Insurance App', () => {
  const BASE_URL = 'https://example-insurance-app.com';

  test('Happy path E2E - complete enrollment with valid webhook JSON', async ({ page }) => {
    // Landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Welcome to Example Insurance' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/landing.png', fullPage: true });

    // Start enrollment
    await page.getByRole('button', { name: 'Start Enrollment' }).click();

    // Personal Information page
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp('example-insurance-app\\.com', 'i'));
    await page.getByLabel('First name').fill('Alice');
    await page.getByLabel('Last name').fill('Johnson');
    await page.getByLabel('Date of birth').fill('1985-07-12');
    await page.getByLabel('Email').fill('alice.johnson@example.com');
    await page.getByLabel('Phone').fill('+15551234567');
    await page.screenshot({ path: 'screenshots/personal-information.png', fullPage: true });

    // Proceed to coverage
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Coverage Options' })).toBeVisible();

    // Select a coverage plan
    const standardPlan = page.getByRole('radio', { name: 'Standard Plan' });
    await standardPlan.check();
    await page.screenshot({ path: 'screenshots/coverage-options.png', fullPage: true });

    // Proceed to integrations / webhook config
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Webhook Configuration' })).toBeVisible();

    // Provide valid webhook JSON payload
    const validPayload = JSON.stringify({
      jira: {
        webhookEnabled: true,
        projectKey: 'ENR',
        events: ['enrollment_created', 'enrollment_updated']
      }
    }, null, 2);
    await page.getByLabel('Webhook Payload').fill(validPayload);
    await page.screenshot({ path: 'screenshots/webhook-configuration-valid.png', fullPage: true });

    // Validate webhook and continue
    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Webhook validated successfully')).toBeVisible();

    // Submit enrollment
    await page.getByRole('button', { name: 'Submit Enrollment' }).click();

    // Confirmation page
    await expect(page.getByRole('heading', { name: 'Enrollment Complete' })).toBeVisible();
    await expect(page.getByText('Thank you for enrolling with Example Insurance')).toBeVisible();
    await page.screenshot({ path: 'screenshots/enrollment-complete.png', fullPage: true });
  });

  test('Negative validation - webhook JSON parse error displays proper messages and prevents submit', async ({ page }) => {
    // Landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Welcome to Example Insurance' })).toBeVisible();

    // Start enrollment
    await page.getByRole('button', { name: 'Start Enrollment' }).click();

    // Personal Information page
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
    await page.getByLabel('First name').fill('Bob');
    await page.getByLabel('Last name').fill('Smith');
    await page.getByLabel('Date of birth').fill('1990-01-20');
    await page.getByLabel('Email').fill('bob.smith@example.com');
    await page.getByLabel('Phone').fill('+15557654321');
    await page.getByRole('button', { name: 'Next' }).click();

    // Coverage Options
    await expect(page.getByRole('heading', { name: 'Coverage Options' })).toBeVisible();
    await page.getByRole('radio', { name: 'Standard Plan' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Webhook Configuration
    await expect(page.getByRole('heading', { name: 'Webhook Configuration' })).toBeVisible();

    // Provide invalid webhook JSON that will cause a parse error
    const invalidPayload = '{ invalidJson: , }';
    await page.getByLabel('Webhook Payload').fill(invalidPayload);
    await page.screenshot({ path: 'screenshots/webhook-configuration-invalid.png', fullPage: true });

    // Attempt to validate invalid JSON
    await page.getByRole('button', { name: 'Validate' }).click();

    // Assertions: App should show parse error and a failed-to-parse message
    await expect(page.getByText('JSON error: Expecting value')).toBeVisible();
    await expect(page.getByText('Failed to parse Jira webhook')).toBeVisible();
    await page.screenshot({ path: 'screenshots/webhook-parse-error.png', fullPage: true });

    // Ensure user cannot submit the enrollment while webhook is invalid
    const submitButton = page.getByRole('button', { name: 'Submit Enrollment' });
    await expect(submitButton).toBeDisabled();

    // Optionally allow user to correct the payload and then validate
    await page.getByLabel('Webhook Payload').fill(JSON.stringify({ jira: { webhookEnabled: false } }, null, 2));
    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Webhook validated successfully')).toBeVisible();
    await page.screenshot({ path: 'screenshots/webhook-configuration-fixed.png', fullPage: true });

    // Now submit should be enabled
    await expect(submitButton).toBeEnabled();
  });
});