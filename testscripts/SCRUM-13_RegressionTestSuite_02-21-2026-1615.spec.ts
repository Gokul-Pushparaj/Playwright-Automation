import { test, expect } from '@playwright/test';

const baseUrl = 'https://the-internet.herokuapp.com/login';
const credentials = {
  username: 'tomsmith',
  password: 'SuperSecretPassword!',
};

test.describe('The Internet - Login page scenarios', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(baseUrl);

    await page.locator('#username').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Submit and wait for navigation to the secure area
    await Promise.all([
      page.waitForNavigation(/* { url: '**/secure' } */),
      page.locator('button[type="submit"]').click(),
    ]);

    // Verify redirected to secure area
    await expect(page).toHaveURL(/\/secure/);

    // Verify success message is displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('You logged into a secure area!');

    // Verify logout button is visible
    const logoutButton = page.locator('a.button', { hasText: 'Logout' });
    await expect(logoutButton).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(baseUrl);

    // Enter invalid username and any password
    await page.locator('#username').fill('invalidUser');
    await page.locator('#password').fill('anyPassword');

    await page.locator('button[type="submit"]').click();

    // Verify error message is displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your username is invalid!');

    // Verify user remains on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(baseUrl);

    // Enter valid username and invalid password
    await page.locator('#username').fill(credentials.username);
    await page.locator('#password').fill('wrongPassword');

    await page.locator('button[type="submit"]').click();

    // Verify error message is displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your password is invalid!');

    // Verify user remains on the login page
    await expect(page).toHaveURL(/\/login/);
  });
});