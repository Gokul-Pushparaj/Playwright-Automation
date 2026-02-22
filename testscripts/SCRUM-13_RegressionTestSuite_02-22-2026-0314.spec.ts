import { test, expect } from '@playwright/test';

const baseUrl = 'https://the-internet.herokuapp.com/login';
const credentials = { username: 'tomsmith', password: 'SuperSecretPassword!' };

test.describe('Login page scenarios', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter username and password
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);

    // Click the login button
    await page.click('button[type="submit"]');

    // Expectations
    await expect(page).toHaveURL(/.*\/secure/);
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter an invalid username and any password
    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // Expect an error message about invalid username
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter valid username and an invalid password
    await page.fill('#username', credentials.username);
    await page.fill('#password', 'badpassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // Expect an error message about invalid password
    await expect(page.locator('#flash')).toContainText('Your password is invalid!');
  });
});