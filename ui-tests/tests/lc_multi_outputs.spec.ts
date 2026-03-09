import { IJupyterLabPage, expect, test } from '@jupyterlab/galata';
import { Page } from '@playwright/test';

function delay(ms: number) {
  // https://stackoverflow.com/questions/37764665/how-to-implement-sleep-function-in-typescript
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForNotebookReady(page: any) {
  // Wait for notebook to be active
  await page.waitForSelector('.jp-Notebook.jp-mod-commandMode, .jp-Notebook.jp-mod-editMode', { timeout: 10000 });
  // Wait a bit for any pending operations
  await page.waitForTimeout(1000);
}

async function execCommandPalette(page: any, commandText: string) {
  const isMac = process.platform === 'darwin';
  await page.keyboard.press(isMac ? 'Meta+Shift+c' : 'Control+Shift+c');
  await page.waitForSelector('.lm-CommandPalette-input', { state: 'visible' });
  await page.keyboard.type(commandText);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.lm-CommandPalette', { state: 'hidden' });
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });
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

test.use({ autoGoto: true, viewport: {width: 1600, height: 1200} });
test('should save current outputs on clicking the pin button', async ({page}) => {
  // create new notebook
  const fileName = "multi_outputs_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

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

test('should persist pinned outputs after save and reload', async ({page}) => {
  // create new notebook
  const fileName = "persist_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // execute cell and pin output
  await page.notebook.setCell(0, 'code', 'print("persisted output")');
  await page.notebook.run();
  await page.locator('.multi-outputs-ui').first().locator('button').click();

  // verify tabs are visible
  let multi_outputs_tabs_container = page
    .locator('.multi-output-container')
    .first();
  await expect(multi_outputs_tabs_container).toBeVisible();
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-1"]')
  ).toBeVisible();

  // save notebook
  await page.notebook.save();
  await delay(500);

  // close notebook
  await page.notebook.close();
  await delay(500);

  // reopen notebook
  await page.filebrowser.open(fileName);
  await waitForNotebookReady(page);
  await delay(500);

  // verify pinned output is restored
  multi_outputs_tabs_container = page
    .locator('.multi-output-container')
    .first();
  await expect(multi_outputs_tabs_container).toBeVisible();
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-current"]')
  ).toBeVisible();
  await expect(
    multi_outputs_tabs_container.locator('li[id="tab-output-1"]')
  ).toBeVisible();

  // verify the pinned output content is preserved
  await multi_outputs_tabs_container.locator('li[id="tab-output-1"]').click();
  await delay(300);
  const outputText = await page.locator('.jp-OutputArea-output').first().textContent();
  expect(outputText).toContain('persisted output');
});

test('should pin outputs on multiple selected cells using toolbar button', async ({page}) => {
  // create new notebook
  const fileName = "toolbar_selection_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // add multiple cells with different outputs
  await page.notebook.setCell(0, 'code', 'print("output from cell 0")');
  await page.notebook.addCell('code', 'print("output from cell 1")');
  await page.notebook.addCell('code', 'print("output from cell 2")');

  // execute all cells (cell 0 gets execution_count=1, cell 1 gets 2, cell 2 gets 3)
  await page.notebook.run();
  await delay(1000);

  // select cells 0 and 1
  await page.notebook.selectCells(0, 1);
  await delay(300);

  // click "Pin Outputs" toolbar button
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // verify pinned tabs appear on selected cells
  // cell 0 has execution_count=1, so pinned output should be tab-output-1
  const cell0Tabs = page.locator('.jp-Cell[data-windowed-list-index="0"]').locator('.multi-output-container');
  await expect(cell0Tabs).toBeVisible();
  await expect(cell0Tabs.locator('li[id="tab-output-1"]')).toBeVisible();

  // cell 1 has execution_count=2, so pinned output should be tab-output-2
  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).toBeVisible();
  await expect(cell1Tabs.locator('li[id="tab-output-2"]')).toBeVisible();

  // verify cell 2 has no pinned tabs
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).not.toBeVisible();

  // verify output contents are preserved
  await cell0Tabs.locator('li[id="tab-output-1"]').click();
  await delay(300);
  const cell0Output = await page.locator('.jp-Cell[data-windowed-list-index="0"]').locator('.jp-OutputArea-output').first().textContent();
  expect(cell0Output).toContain('output from cell 0');

  await cell1Tabs.locator('li[id="tab-output-2"]').click();
  await delay(300);
  const cell1Output = await page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.jp-OutputArea-output').first().textContent();
  expect(cell1Output).toContain('output from cell 1');
});

test('should pin outputs in below section using command palette', async ({page}) => {
  // create new notebook
  const fileName = "command_below_section_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // create a notebook structure with markdown heading and multiple cells
  // Structure:
  // Cell 0: # Section 1 (markdown heading)
  // Cell 1: print("cell 1") (code)
  // Cell 2: print("cell 2") (code) <- activate this cell
  // Cell 3: print("cell 3") (code)
  // Cell 4: # Section 2 (markdown heading - end of section 1, same level)
  // Cell 5: print("cell 5") (code) - should NOT be pinned (different section)
  await page.notebook.setCell(0, 'markdown', '# Section 1');
  await page.notebook.addCell('code', 'print("cell 1")');
  await page.notebook.addCell('code', 'print("cell 2")');
  await page.notebook.addCell('code', 'print("cell 3")');
  await page.notebook.addCell('markdown', '# Section 2');
  await page.notebook.addCell('code', 'print("cell 5")');

  // run all cells
  await page.notebook.run();
  await delay(1000);

  // activate cell 2 and run command to pin outputs in below section
  await page.notebook.selectCells(2, 2);
  await delay(300);

  // open command palette and execute pin outputs in below section
  await execCommandPalette(page, 'Pin Outputs In Below Section')

  // verify that cell 2 and cell 3 have pinned tabs (cells in same section from cell 2 onwards)
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).toBeVisible();

  const cell3Tabs = page.locator('.jp-Cell[data-windowed-list-index="3"]').locator('.multi-output-container');
  await expect(cell3Tabs).toBeVisible();

  // verify that cell 1 does NOT have pinned tabs (above active cell)
  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).not.toBeVisible();

  // verify that cell 5 does NOT have pinned tabs (different section)
  const cell5Tabs = page.locator('.jp-Cell[data-windowed-list-index="5"]').locator('.multi-output-container');
  await expect(cell5Tabs).not.toBeVisible();
});

test('should pin outputs in below all using command palette', async ({page}) => {
  // create new notebook with same structure as below section test
  const fileName = "command_below_all_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // create the same notebook structure to test that below all crosses sections
  // Structure:
  // Cell 0: # Section 1 (markdown heading)
  // Cell 1: print("cell 1") (code)
  // Cell 2: print("cell 2") (code) <- activate this cell
  // Cell 3: print("cell 3") (code)
  // Cell 4: # Section 2 (markdown heading)
  // Cell 5: print("cell 5") (code) - SHOULD be pinned (below all crosses sections)
  await page.notebook.setCell(0, 'markdown', '# Section 1');
  await page.notebook.addCell('code', 'print("cell 1")');
  await page.notebook.addCell('code', 'print("cell 2")');
  await page.notebook.addCell('code', 'print("cell 3")');
  await page.notebook.addCell('markdown', '# Section 2');
  await page.notebook.addCell('code', 'print("cell 5")');

  // run all cells
  await page.notebook.run();
  await delay(1000);

  // activate cell 2 and run command to pin outputs in below all
  await page.notebook.selectCells(2, 2);
  await delay(300);

  // open command palette and execute pin outputs in below all
  await execCommandPalette(page, 'Pin Outputs In Below All');

  // verify that cells 2, 3 and 5 have pinned tabs (all cells from active cell onwards, including other sections)
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).toBeVisible();

  const cell3Tabs = page.locator('.jp-Cell[data-windowed-list-index="3"]').locator('.multi-output-container');
  await expect(cell3Tabs).toBeVisible();

  const cell5Tabs = page.locator('.jp-Cell[data-windowed-list-index="5"]').locator('.multi-output-container');
  await expect(cell5Tabs).toBeVisible();

  // verify that cell 1 does NOT have pinned tabs (above active cell)
  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).not.toBeVisible();
});

test('should remove outputs in below section using command palette', async ({page}) => {
  // create new notebook
  const fileName = "command_remove_below_section_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // create a notebook structure with markdown heading
  // Cell 0: # Section 1 (markdown)
  // Cell 1: print("cell 1") (code)
  // Cell 2: print("cell 2") (code) <- activate this
  // Cell 3: print("cell 3") (code)
  // Cell 4: # Section 2 (markdown, same level as Section 1)
  // Cell 5: print("cell 5") (code) - should NOT be affected
  await page.notebook.setCell(0, 'markdown', '# Section 1');
  await page.notebook.addCell('code', 'print("cell 1")');
  await page.notebook.addCell('code', 'print("cell 2")');
  await page.notebook.addCell('code', 'print("cell 3")');
  await page.notebook.addCell('markdown', '# Section 2');
  await page.notebook.addCell('code', 'print("cell 5")');

  // run all cells
  await page.notebook.run();
  await delay(1000);

  // pin outputs on all code cells first
  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(3, 3);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(5, 5);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // run cells again to create multiple pinned outputs
  await page.notebook.run();
  await delay(1000);

  // pin again to have 2 pinned outputs per cell
  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(3, 3);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(5, 5);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // activate cell 2 and run command to remove outputs in below section
  await page.notebook.selectCells(2, 2);
  await delay(300);

  // open command palette and execute remove outputs in below section
  await execCommandPalette(page, 'Remove Outputs In Below Section');

  // verify that cells 2 and 3 now have only 1 pinned output (the latest one)
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).toBeVisible();
  // Should have current tab + only 1 pinned tab (the latest execution_count)
  await expect(cell2Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  const cell3Tabs = page.locator('.jp-Cell[data-windowed-list-index="3"]').locator('.multi-output-container');
  await expect(cell3Tabs).toBeVisible();
  await expect(cell3Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  // verify that cell 1 still has 2 pinned outputs (not affected - above active cell)
  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).toBeVisible();
  await expect(cell1Tabs.locator('li[id^="tab-output-"]')).toHaveCount(3); // current + 2 pinned

  // verify that cell 5 still has 2 pinned outputs (not affected - different section)
  const cell5Tabs = page.locator('.jp-Cell[data-windowed-list-index="5"]').locator('.multi-output-container');
  await expect(cell5Tabs).toBeVisible();
  await expect(cell5Tabs.locator('li[id^="tab-output-"]')).toHaveCount(3); // current + 2 pinned
});

test('should remove outputs in below all using command palette', async ({page}) => {
  // create new notebook with same structure
  const fileName = "command_remove_below_all_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // create the same notebook structure to test that below all crosses sections
  await page.notebook.setCell(0, 'markdown', '# Section 1');
  await page.notebook.addCell('code', 'print("cell 1")');
  await page.notebook.addCell('code', 'print("cell 2")');
  await page.notebook.addCell('code', 'print("cell 3")');
  await page.notebook.addCell('markdown', '# Section 2');
  await page.notebook.addCell('code', 'print("cell 5")');

  // run all cells
  await page.notebook.run();
  await delay(1000);

  // pin outputs on all code cells
  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(3, 3);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(5, 5);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // run again and pin again to create 2 pinned outputs per cell
  await page.notebook.run();
  await delay(1000);

  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(3, 3);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(5, 5);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // activate cell 2 and run command to remove outputs in below all
  await page.notebook.selectCells(2, 2);
  await delay(300);

  // open command palette and execute remove outputs in below all
  await execCommandPalette(page, 'Remove Outputs In Below All');

  // verify that cells 2, 3 and 5 now have only 1 pinned output (below all crosses sections)
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).toBeVisible();
  await expect(cell2Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  const cell3Tabs = page.locator('.jp-Cell[data-windowed-list-index="3"]').locator('.multi-output-container');
  await expect(cell3Tabs).toBeVisible();
  await expect(cell3Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  const cell5Tabs = page.locator('.jp-Cell[data-windowed-list-index="5"]').locator('.multi-output-container');
  await expect(cell5Tabs).toBeVisible();
  await expect(cell5Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  // verify that cell 1 still has 2 pinned outputs (not affected - above active cell)
  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).toBeVisible();
  await expect(cell1Tabs.locator('li[id^="tab-output-"]')).toHaveCount(3); // current + 2 pinned
});

test('should pin outputs on selected cells using command palette', async ({page}) => {
  // create new notebook
  const fileName = "command_pin_selection_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // add multiple cells with different outputs
  await page.notebook.setCell(0, 'code', 'print("output from cell 0")');
  await page.notebook.addCell('code', 'print("output from cell 1")');
  await page.notebook.addCell('code', 'print("output from cell 2")');

  // execute all cells
  await page.notebook.run();
  await delay(1000);

  // select cells 0 and 1
  await page.notebook.selectCells(0, 1);
  await delay(300);

  // open command palette and execute pin outputs on selection
  await execCommandPalette(page, 'Pin Outputs On Selection');

  // verify pinned tabs appear on selected cells
  const cell0Tabs = page.locator('.jp-Cell[data-windowed-list-index="0"]').locator('.multi-output-container');
  await expect(cell0Tabs).toBeVisible();
  await expect(cell0Tabs.locator('li[id="tab-output-1"]')).toBeVisible();

  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).toBeVisible();
  await expect(cell1Tabs.locator('li[id="tab-output-2"]')).toBeVisible();

  // verify cell 2 has no pinned tabs
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).not.toBeVisible();
});

test('should remove pinned outputs on selected cells using command palette', async ({page}) => {
  // create new notebook
  const fileName = "command_remove_selection_test.ipynb";
  await page.notebook.createNew(fileName);
  await page.waitForSelector(`[role="main"] >> text=${fileName}`);
  await waitForNotebookReady(page);

  // add multiple cells
  await page.notebook.setCell(0, 'code', 'print("output from cell 0")');
  await page.notebook.addCell('code', 'print("output from cell 1")');
  await page.notebook.addCell('code', 'print("output from cell 2")');

  // execute all cells
  await page.notebook.run();
  await delay(1000);

  // pin outputs on all cells
  await page.notebook.selectCells(0, 0);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // run again to create more outputs
  await page.notebook.run();
  await delay(1000);

  // pin again to have 2 pinned outputs per cell
  await page.notebook.selectCells(0, 0);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(1, 1);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(300);
  await page.notebook.selectCells(2, 2);
  await page.locator('jp-button[title="Pin Outputs"]').click();
  await delay(500);

  // select cells 0 and 1
  await page.notebook.selectCells(0, 1);
  await delay(300);

  // open command palette and execute remove outputs on selection
  await execCommandPalette(page, 'Remove Outputs On Selection');

  // verify that cells 0 and 1 now have only 1 pinned output
  const cell0Tabs = page.locator('.jp-Cell[data-windowed-list-index="0"]').locator('.multi-output-container');
  await expect(cell0Tabs).toBeVisible();
  await expect(cell0Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  const cell1Tabs = page.locator('.jp-Cell[data-windowed-list-index="1"]').locator('.multi-output-container');
  await expect(cell1Tabs).toBeVisible();
  await expect(cell1Tabs.locator('li[id^="tab-output-"]')).toHaveCount(2); // current + 1 pinned

  // verify that cell 2 still has 2 pinned outputs (not affected)
  const cell2Tabs = page.locator('.jp-Cell[data-windowed-list-index="2"]').locator('.multi-output-container');
  await expect(cell2Tabs).toBeVisible();
  await expect(cell2Tabs.locator('li[id^="tab-output-"]')).toHaveCount(3); // current + 2 pinned
});
