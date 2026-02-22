import { test, expect } from '@playwright/test';

const BASE_URL = 'https://the-internet.herokuapp.com/login';

test.describe('Login functionality', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/secure/);

    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('You logged into a secure area!');

    const logoutButton = page.locator('a.button');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toHaveText(/Logout/);
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'invalidPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your password is invalid!');
  });
});