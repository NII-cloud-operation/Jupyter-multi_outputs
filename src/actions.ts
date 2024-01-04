import $ from 'jquery';
import {
  isCodeCellModel,
  CodeCell,
  ICellModel,
  isMarkdownCellModel,
  Cell,
  MarkdownCell
} from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';
import { getSectionCells } from './getSectionCells';
import { leaveLatestPinnedOutputs } from './outputUtils';
import { pinOutput } from './pinOutput';

/**
 * 選択したセルの出力を保存する
 */
export function pinOutputOnSelection(notebook: Notebook): void {
  getSelectedOrActiveCells(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      pinOutput(cell as CodeCell);
    }
  });
}

/**
 * 選択したセルの保存した出力を最新の1件だけ残して破棄する
 */
export function removeOutputOnSelection(notebook: Notebook): void {
  console.debug('remove outputs on selection');
  getSelectedOrActiveCells(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      leaveLatestPinnedOutputs(cell.model, 1);
    }
  });
}

/**
 * 同じセクション内で選択したセルより下のセルの出力を保存する
 */
export function pinOutputsInBelowSection(notebook: Notebook): void {
  console.debug('pin outputs in below section');
  getCellsInBelowSection(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      pinOutput(cell as CodeCell);
    }
  });
}

/**
 * 同じセクション内で選択したセルより下のセルの保存した出力を最新の1件だけ残して破棄する
 */
export function removeOutputsInBelowSection(notebook: Notebook): void {
  console.debug('remove outputs in below section');
  getCellsInBelowSection(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      leaveLatestPinnedOutputs(cell.model, 1);
    }
  });
}

/**
 * 選択したセルより下のセルの出力を保存する
 */
export function pinOutputsInBelowAll(notebook: Notebook): void {
  console.debug('pin outputs in below all');
  getCellsInBelowAll(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      pinOutput(cell as CodeCell);
    }
  });
}

/**
 * 選択したセルより下のセルの保存した出力を最新の1件だけ残して破棄する
 */
export function removeOutputsInBelowAll(notebook: Notebook): void {
  console.debug('remove outputs in below all');
  getCellsInBelowAll(notebook).forEach(cell => {
    if (isCodeCellModel(cell.model)) {
      leaveLatestPinnedOutputs(cell.model, 1);
    }
  });
}

function getSelectedOrActiveCells(notebook: Notebook) {
  return notebook.widgets.filter(cell => notebook.isSelectedOrActive(cell));
}

function getCellsInBelowSection(notebook: Notebook) {
  const index = notebook.activeCellIndex;
  const cells = notebook.widgets;

  const headingCell = findHeadingCell(cells[index], notebook);
  let section;
  if (headingCell) {
    section = getSectionCells(headingCell, notebook);
    section.splice(0, 0, headingCell);
  } else {
    section = [];
    const level = getCellLevel(cells[index]);
    for (let i = index; i < cells.length; ++i) {
      if (getCellLevel(cells[i]) !== level) {
        break;
      }
      section.push(cells[i]);
    }
  }

  const sectionCells = [];
  const index_in_section = $.inArray(cells[index], section);
  for (let i = index_in_section; i < section.length; ++i) {
    sectionCells.push(section[i]);
  }

  return sectionCells;
}

function findHeadingCell(cell: Cell<ICellModel>, notebook: Notebook) {
  if (isCellHeading(cell)) {
    return cell;
  }

  const cells = notebook.widgets;
  const index = notebook.activeCellIndex;
  if (index === 0) {
    return null;
  }
  for (let i = index - 1; i >= 0; --i) {
    if (isCellHeading(cells[i])) {
      return cells[i];
    }
  }
  return null;
}

function isCellHeading(cell: Cell<ICellModel>): boolean {
  return getCellLevel(cell) < 7;
}

function getCellLevel(cell: Cell<ICellModel>): number {
  if (isMarkdownCellModel(cell.model)) {
    return (cell as MarkdownCell).headingInfo.level;
  }
  return 7;
}

function getCellsInBelowAll(notebook: Notebook): Cell<ICellModel>[] {
  const index = notebook.activeCellIndex;
  const cells = [...notebook.widgets];
  cells.splice(0, index);
  return cells;
}
