import { test, expect } from '@playwright/test';
test.describe('Registered user login', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
  });

  test('Login failure with invalid username', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');
  });

  test('Login failure with invalid password', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.fill('#username', 'tomsmith');
    await page.click('button[type="submit"]');
    await expect(page.locator('#flash')).toContainText('Your password is invalid!');
  });

});