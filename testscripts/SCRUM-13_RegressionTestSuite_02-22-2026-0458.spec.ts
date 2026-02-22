import { test, expect } from '@playwright/test';

const baseURL = 'https://the-internet.herokuapp.com/login';
const credentials = {
  username: 'tomsmith',
  password: 'SuperSecretPassword!',
};

test.describe('Login functionality', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseURL);

    // Enter username and password
    await page.locator('#username').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Click the login button
    await page.locator('button[type="submit"]').click();

    // Expected: User is redirected to the secure area
    await expect(page).toHaveURL(/\/secure/);

    // Expected: A success message is displayed
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('You logged into a secure area!');

    // Expected: A logout button is visible
    await expect(page.locator('a[href="/logout"]')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseURL);

    // Enter an invalid username and any password
    await page.locator('#username').fill('wronguser');
    await page.locator('#password').fill('anyPassword');

    // Click the login button
    await page.locator('button[type="submit"]').click();

    // Expected: An error message is displayed saying: Your username is invalid!
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    // Navigate to the login page
    await page.goto(baseURL);

    // Enter valid username and an invalid password
    await page.locator('#username').fill(credentials.username);
    await page.locator('#password').fill('wrongPassword');

    // Click the login button
    await page.locator('button[type="submit"]').click();

    // Expected: An error message is displayed saying: Your password is invalid!
    const flash = page.locator('#flash');
    await expect(flash).toBeVisible();
    await expect(flash).toContainText('Your password is invalid!');
  });
});