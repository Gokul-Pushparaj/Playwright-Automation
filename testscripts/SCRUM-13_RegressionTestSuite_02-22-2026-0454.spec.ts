import { test, expect } from '@playwright/test';

const baseUrl = 'https://the-internet.herokuapp.com/login';
const credentials = {
  username: 'tomsmith',
  password: 'SuperSecretPassword!',
};

test.describe('Login Page', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter valid username
    await page.fill('#username', credentials.username);

    // Enter valid password
    await page.fill('#password', credentials.password);

    // Click the login button
    await page.click('button[type="submit"]');

    // User is redirected to the secure area
    await expect(page).toHaveURL(/\/secure/);

    // A success message is displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('You logged into a secure area!');

    // A logout button is visible
    await expect(page.locator('a[href="/logout"]')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter an invalid username
    await page.fill('#username', 'invalidUser');

    // Enter any password
    await page.fill('#password', 'anyPassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // An error message is displayed saying: "Your username is invalid!"
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseUrl);

    // Enter valid username
    await page.fill('#username', credentials.username);

    // Enter an invalid password
    await page.fill('#password', 'invalidPassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // An error message is displayed saying: "Your password is invalid!"
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your password is invalid!');
  });
});