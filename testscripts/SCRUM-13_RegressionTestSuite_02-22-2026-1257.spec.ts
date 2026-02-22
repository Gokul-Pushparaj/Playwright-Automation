import { test, expect } from '@playwright/test';

const baseUrl = 'https://the-internet.herokuapp.com/login';
const credentials = { username: 'tomsmith', password: 'SuperSecretPassword!' };

test.describe('Login tests', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(baseUrl);

    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');

    const secureUrl = new URL(baseUrl).origin + '/secure';
    await expect(page).toHaveURL(secureUrl);

    const flash = page.locator('#flash');
    await expect(flash).toContainText('You logged into a secure area!');
    await expect(page.locator('a.button')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(baseUrl);

    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(baseUrl);

    await page.fill('#username', credentials.username);
    await page.fill('#password', 'wrongPassword');
    await page.click('button[type="submit"]');

    const flash = page.locator('#flash');
    await expect(flash).toContainText('Your password is invalid!');
  });
});