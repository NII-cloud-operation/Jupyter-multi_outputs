import { IJupyterLabPage, expect, test } from '@jupyterlab/galata';
import { Page } from '@playwright/test';

function delay(ms: number) {
  // https://stackoverflow.com/questions/37764665/how-to-implement-sleep-function-in-typescript
  return new Promise(resolve => setTimeout(resolve, ms));
}

// https://github.com/jupyterlab/jupyterlab/blob/9844a6fdb680aeae28a4d6238433f751ce5a6204/galata/src/fixtures.ts#L319-L336
async function myWaitForApplication({ baseURL }, use) {
  const waitIsReady = async (
    page: Page,
    helpers: IJupyterLabPage
  ): Promise<void> => {
    await page.waitForSelector('#jupyterlab-splash', {
      state: 'detached'
    });
    //! not wait for launcher tab.
  };
  await use(waitIsReady);
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false, waitForApplication: myWaitForApplication });
test('should emit an activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });
  // load jupyter lab
  await page.goto();

  expect(
    logs.filter(
      s => s === 'JupyterLab extension lc_multi_outputs is activated!'
    )
  ).toHaveLength(1);
});

test.use({ autoGoto: true, waitForApplication: myWaitForApplication });
test('should save current outputs on clicking the pin button', async ({
  page
}) => {
  // create new notebook
  await page.notebook.createNew();
  // edit
  await page.notebook.setCell(0, 'code', 'print("test")');
  // run
  await page.notebook.run();
  // click pin button on cell
  await page.locator('.multi-outputs-ui').first().locator('button').click();
  // has tabs
  let multi_outputs_tabs_container = page
    .locator('.multi-output-container')
    .first();
  await expect(multi_outputs_tabs_container).toBeVisible();
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-current"]')
  ).toBeVisible();
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-1"]')
  ).toBeVisible();
  // edit
  await page.notebook.setCell(0, 'code', 'print("test2")\n');
  // run
  await page.notebook.run();
  // click add pin button on toolbar
  await page.notebook.selectCells(0, 0);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  // has tabs
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-2"]')
  ).toBeVisible();
  // click output-1 tab
  await multi_outputs_tabs_container.locator('li[id="tab-output-1"]').click();
  // click diff button
  await page
    .locator('#output-1')
    .locator('.multi-outputs-diff-ui')
    .locator('button')
    .click();
  await delay(1000);
  // has dialog
  await expect(
    page.locator('dialog').first().getByText('Diff: Out[2] <- Out[1]')
  ).toBeVisible();
  // close dialog
  await page.locator('dialog').first().getByText('Close').click();
  await delay(1000);
  // click remove pin button on toolbar
  await page
    .locator('jp-button[title="Remove Pinned Outputs Leaving One"]')
    .click();
  // not has output-1 tab
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-1"]')
  ).not.toBeVisible();
  // click close button on output-2 tab
  await page.locator('li[id="tab-output-2"]').locator('button').click();
  // has no tabs
  await expect(page.locator('.multi-output-container')).not.toBeVisible();
});
