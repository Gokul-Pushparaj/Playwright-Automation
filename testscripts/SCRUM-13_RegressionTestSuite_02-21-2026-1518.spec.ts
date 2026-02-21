import { test, expect } from '@playwright/test';

test.describe('Login Page - the-internet.herokuapp.com', () => {
  const LOGIN_URL = 'https://the-internet.herokuapp.com/login';
  const SECURE_URL = 'https://the-internet.herokuapp.com/secure';
  const VALID_USERNAME = 'tomsmith';
  const VALID_PASSWORD = 'SuperSecretPassword!';

  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test('Successful login with valid credentials', async ({ page }) => {
    const testInfo = test.info();

    // Fill username and password using label selectors
    await page.getByLabel('Username').fill(VALID_USERNAME);
    await page.getByLabel('Password').fill(VALID_PASSWORD);

    // Click the login button using role selector
    await page.getByRole('button', { name: 'Login' }).click();

    // Validate redirection to secure area
    await expect(page).toHaveURL(SECURE_URL);

    // Validate success message is visible and contains expected text
    const successLocator = page.locator('#flash'); // message element
    await expect(successLocator).toBeVisible();
    await expect(successLocator).toContainText('You logged into a secure area!');

    // Validate logout button/link is visible using role selector
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    // Screenshot of the secure area after successful login
    const screenshotPath = testInfo.outputPath('successful-login.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });

  test('Login failure with invalid username', async ({ page }) => {
    const testInfo = test.info();

    // Enter invalid username and any password using label selectors
    await page.getByLabel('Username').fill('invalidUser');
    await page.getByLabel('Password').fill('anyPassword123');

    // Click login
    await page.getByRole('button', { name: 'Login' }).click();

    // Validate we're still on login page
    await expect(page).toHaveURL(LOGIN_URL);

    // Validate error message for invalid username
    const errorLocator = page.locator('#flash');
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText('Your username is invalid!');

    // Screenshot of the error state
    const screenshotPath = testInfo.outputPath('invalid-username.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });

  test('Login failure with invalid password', async ({ page }) => {
    const testInfo = test.info();

    // Enter valid username and invalid password using label selectors
    await page.getByLabel('Username').fill(VALID_USERNAME);
    await page.getByLabel('Password').fill('WrongPassword!');

    // Click login
    await page.getByRole('button', { name: 'Login' }).click();

    // Validate we're still on login page
    await expect(page).toHaveURL(LOGIN_URL);

    // Validate error message for invalid password
    const errorLocator = page.locator('#flash');
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText('Your password is invalid!');

    // Screenshot of the error state
    const screenshotPath = testInfo.outputPath('invalid-password.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });
});