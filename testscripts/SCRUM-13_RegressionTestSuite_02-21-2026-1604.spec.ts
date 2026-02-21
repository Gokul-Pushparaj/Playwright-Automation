import { test, expect } from '@playwright/test';

const testData = {
  "base_url": "https://the-internet.herokuapp.com/login",
  "credentials": {
    "username": "tomsmith",
    "password": "SuperSecretPassword!"
  }
};

test.describe('Login tests', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto(testData.base_url);

    // Enter credentials
    await page.fill('#username', testData.credentials.username);
    await page.fill('#password', testData.credentials.password);

    // Click login and wait for navigation to secure area
    const [response] = await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Verify redirected to secure area
    const secureUrl = testData.base_url.replace('/login', '/secure');
    await expect(page).toHaveURL(secureUrl);

    // Verify success message
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');

    // Verify logout button is visible
    await expect(page.locator('a[href="/logout"]')).toBeVisible();
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto(testData.base_url);

    // Enter invalid username and any password
    await page.fill('#username', 'invalidUser');
    await page.fill('#password', 'anyPassword');

    // Click login (no navigation expected)
    await page.click('button[type="submit"]');

    // Verify error message for invalid username
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto(testData.base_url);

    // Enter valid username and invalid password
    await page.fill('#username', testData.credentials.username);
    await page.fill('#password', 'InvalidPassword!');

    // Click login (no navigation expected)
    await page.click('button[type="submit"]');

    // Verify error message for invalid password
    await expect(page.locator('#flash')).toContainText('Your password is invalid!');
  });
});