import { test, expect } from '@playwright/test';

test.describe('Login page - the-internet.herokuapp.com', () => {
  const baseUrl = 'https://the-internet.herokuapp.com/login';

  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to the exact URL provided
    await page.goto(baseUrl);
    await expect(page).toHaveURL(baseUrl);

    // Use label/role selectors for fields and button
    const username = page.getByLabel('Username');
    const password = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: /login/i });

    // Fill username/password
    await username.fill('tomsmith');
    await expect(username).toHaveValue('tomsmith');
    await password.fill('SuperSecretPassword!');
    await expect(password).toHaveValue('SuperSecretPassword!');

    // Click login
    await loginButton.click();

    // Validate success scenario
    await page.waitForURL(/\/secure/);
    await expect(page).toHaveURL(/\/secure/);

    // Success message should be displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('You logged into a secure area!');

    // Logout button/link should be visible (use role selector)
    const logout = page.getByRole('link', { name: /logout/i });
    await expect(logout).toBeVisible();

    // Screenshot after successful login
    await page.screenshot({ path: 'screenshots/success-login.png', fullPage: true });
  });

  test('Login failure with invalid username', async ({ page }) => {
    // Navigate to the exact URL provided
    await page.goto(baseUrl);
    await expect(page).toHaveURL(baseUrl);

    // Use label/role selectors
    const username = page.getByLabel('Username');
    const password = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: /login/i });

    // Fill invalid username and any password
    await username.fill('invalidUser');
    await expect(username).toHaveValue('invalidUser');
    await password.fill('somePassword');
    await expect(password).toHaveValue('somePassword');

    // Click login
    await loginButton.click();

    // Validate error message for invalid username
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your username is invalid!');

    // Ensure we did not navigate to secure area
    await expect(page).not.toHaveURL(/\/secure/);

    // Screenshot after invalid username attempt
    await page.screenshot({ path: 'screenshots/invalid-username.png', fullPage: true });
  });

  test('Login failure with invalid password', async ({ page }) => {
    // Navigate to the exact URL provided
    await page.goto(baseUrl);
    await expect(page).toHaveURL(baseUrl);

    // Use label/role selectors
    const username = page.getByLabel('Username');
    const password = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: /login/i });

    // Fill valid username and invalid password
    await username.fill('tomsmith');
    await expect(username).toHaveValue('tomsmith');
    await password.fill('WrongPassword!');
    await expect(password).toHaveValue('WrongPassword!');

    // Click login
    await loginButton.click();

    // Validate error message for invalid password
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your password is invalid!');

    // Ensure we did not navigate to secure area
    await expect(page).not.toHaveURL(/\/secure/);

    // Screenshot after invalid password attempt
    await page.screenshot({ path: 'screenshots/invalid-password.png', fullPage: true });
  });
});