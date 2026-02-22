import { test, expect } from '@playwright/test';

const base_url = 'https://the-internet.herokuapp.com/login';
const credentials = { username: 'tomsmith', password: 'SuperSecretPassword!' };

test.describe('Login scenarios for the-internet.herokuapp.com', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(base_url);

    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/secure/);

    const flash = page.locator('#flash');
    await expect(flash).toContainText('You logged into a secure area!');

    const logoutButton = page.locator('a[href="/logout"]');
    await expect(logoutButton).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(base_url);

    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(base_url);

    await page.fill('#username', credentials.username);
    await page.fill('#password', 'invalidPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toContainText('Your password is invalid!');
  });
});