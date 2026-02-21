import { defineConfig } from '@playwright/test';

export default defineConfig({

  testDir: './testscripts',

  timeout: 60000,

  reporter: [
    ['list'],
    ['json', { outputFile: 'result.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  use: {

    headless: true,

    screenshot: 'on',

    video: 'on',

    trace: 'retain-on-failure'

  }

});