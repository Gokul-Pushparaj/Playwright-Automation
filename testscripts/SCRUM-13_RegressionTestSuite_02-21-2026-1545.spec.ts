import { test, expect } from '@playwright/test';

const baseUrl = 'https://the-internet.herokuapp.com/login';
const credentials = {
  username: 'tomsmith',
  password: 'SuperSecretPassword!',
};

test.describe('Login tests', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter username and password, then submit
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');

    // Expect user is redirected to the secure area
    await expect(page).toHaveURL(/\/secure/);

    // Expect a success message is displayed
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');

    // Expect a logout button is visible
    await expect(page.locator('a[href="/logout"]')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter an invalid username and any password, then submit
    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');
    await page.click('button[type="submit"]');

    // Expect an error message about invalid username
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter valid username and an invalid password, then submit
    await page.fill('#username', credentials.username);
    await page.fill('#password', 'invalidPassword');
    await page.click('button[type="submit"]');

    // Expect an error message about invalid password
    await expect(page.locator('#flash')).toContainText('Your password is invalid!');
  });
});