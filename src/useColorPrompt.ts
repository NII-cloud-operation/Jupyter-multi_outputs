import { Cell, ICellModel } from '@jupyterlab/cells';
import { NotebookActions } from '@jupyterlab/notebook';

export function useColorPrompt(): void {
  NotebookActions.executionScheduled.connect((_, { cell }) => {
    setCellRunning(cell);
  });

  NotebookActions.executed.connect((_, { cell, success }) => {
    setCellResult(cell, success);
  });
}

function setCellResult(cell: Cell<ICellModel>, success: boolean): void {
  if (success) {
    setCellSuccess(cell);
  } else {
    setCellError(cell);
  }
}

function resetCellStatus(cell: Cell<ICellModel>) {
  cell.removeClass('cell-status-inqueue');
  cell.removeClass('cell-status-success');
  cell.removeClass('cell-status-error');
}

function setCellRunning(cell: Cell<ICellModel>) {
  resetCellStatus(cell);
  cell.addClass('cell-status-inqueue');
}
function setCellSuccess(cell: Cell<ICellModel>) {
  resetCellStatus(cell);
  cell.addClass('cell-status-success');
}
function setCellError(cell: Cell<ICellModel>) {
  resetCellStatus(cell);
  cell.addClass('cell-status-error');
}
