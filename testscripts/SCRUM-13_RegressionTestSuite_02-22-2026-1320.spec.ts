import { test, expect } from '@playwright/test';

const base_url = 'https://the-internet.herokuapp.com/login';
const credentials = {
  username: 'tomsmith',
  password: 'SuperSecretPassword!',
};

test.describe('Login tests', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(base_url);
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');

    // Expect to be redirected to the secure area
    await expect(page).toHaveURL(/.*\/secure/);

    // Expect a success message to be displayed
    await expect(page.locator('#flash')).toContainText('You logged into a secure area');

    // Expect a logout button to be visible
    await expect(page.locator('a[href="/logout"]')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(base_url);
    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');
    await page.click('button[type="submit"]');

    // Expect an error message about invalid username
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(base_url);
    await page.fill('#username', credentials.username);
    await page.fill('#password', 'invalidPass');
    await page.click('button[type="submit"]');

    // Expect an error message about invalid password
    await expect(page.locator('#flash')).toContainText('Your password is invalid!');
  });
});