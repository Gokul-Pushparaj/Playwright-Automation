import { test, expect } from '@playwright/test';

test.describe('Multi-page Enrollment Flow - Example Insurance App', () => {
  const BASE_URL = 'https://example-insurance-app.com';

  test('Happy path E2E flow - complete enrollment successfully', async ({ page }) => {
    // Landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: /Welcome to Example Insurance/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/landing-page.png', fullPage: true });

    // Start enrollment
    await page.getByRole('button', { name: /Start Enrollment/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/personal/);
    await expect(page.getByRole('heading', { name: /Personal Information/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/personal-info.png', fullPage: true });

    // Personal information
    await page.getByLabel('First name').fill('Alice');
    await page.getByLabel('Last name').fill('Johnson');
    await page.getByLabel('Date of birth').fill('1990-05-10');
    await page.getByLabel('Email').fill('alice.johnson@example.com');
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForLoadState('networkidle');

    // Plan selection
    await expect(page).toHaveURL(/\/plan/);
    await expect(page.getByRole('heading', { name: /Choose a plan/i })).toBeVisible();
    // Select Premium Plan
    const premiumRadio = page.getByRole('radio', { name: /Premium Plan/i });
    await premiumRadio.check();
    await page.screenshot({ path: 'screenshots/plan-selection.png', fullPage: true });
    await page.getByRole('button', { name: /Continue|Next/i }).click();
    await page.waitForLoadState('networkidle');

    // Review
    await expect(page).toHaveURL(/\/review/);
    await expect(page.getByRole('heading', { name: /Review Your Enrollment/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/review-before-confirm.png', fullPage: true });

    // Confirm enrollment
    await page.getByRole('button', { name: /Confirm Enrollment|Complete Enrollment/i }).click();
    await page.waitForLoadState('networkidle');

    // Confirmation
    await expect(page.getByRole('heading', { name: /Enrollment Confirmed|Thank you for enrolling/i })).toBeVisible();
    await expect(page.getByText(/Enrollment Confirmed|Your enrollment has been processed/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/confirmation-happy.png', fullPage: true });
  });

  test('Negative validation - invalid webhook JSON shows JSON error: Expecting value', async ({ page }) => {
    // Landing page
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: /Welcome to Example Insurance/i })).toBeVisible();

    // Start enrollment
    await page.getByRole('button', { name: /Start Enrollment/i }).click();
    await page.waitForLoadState('networkidle');

    // Personal information
    await expect(page.getByRole('heading', { name: /Personal Information/i })).toBeVisible();
    await page.getByLabel('First name').fill('Bob');
    await page.getByLabel('Last name').fill('Martin');
    await page.getByLabel('Date of birth').fill('1985-11-03');
    await page.getByLabel('Email').fill('bob.martin@example.com');
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForLoadState('networkidle');

    // Plan selection
    await expect(page.getByRole('heading', { name: /Choose a plan/i })).toBeVisible();
    const basicRadio = page.getByRole('radio', { name: /Basic Plan/i });
    await basicRadio.check();
    await page.getByRole('button', { name: /Continue|Next/i }).click();
    await page.waitForLoadState('networkidle');

    // Review - intentionally provide invalid JSON in webhook payload field
    await expect(page.getByRole('heading', { name: /Review Your Enrollment/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/review-before-error.png', fullPage: true });

    // Fill invalid webhook JSON to trigger client-side validation error
    const webhookField = page.getByLabel(/Webhook JSON/i);
    // Common invalid JSON that will trigger "Expecting value"
    await webhookField.fill('{ invalidJson: }');
    await page.screenshot({ path: 'screenshots/invalid-webhook-filled.png', fullPage: true });

    // Attempt to confirm enrollment
    await page.getByRole('button', { name: /Confirm Enrollment|Complete Enrollment/i }).click();
    await page.waitForTimeout(500); // allow UI validation to surface

    // Assert validation error is shown and prevents completion
    const errorMessage = page.getByText(/JSON error: Expecting value/i);
    await expect(errorMessage).toBeVisible();
    await page.screenshot({ path: 'screenshots/json-error-visible.png', fullPage: true });

    // Ensure we are still on the review page and not navigated to confirmation
    await expect(page).toHaveURL(/\/review/);
    await expect(page.getByRole('heading', { name: /Enrollment Confirmed|Thank you for enrolling/i })).not.toBeVisible();
  });
});