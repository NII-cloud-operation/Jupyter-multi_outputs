import { ToolbarButton } from '@jupyterlab/apputils';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { pinOutputOnSelection, removeOutputOnSelection } from './actions';

export function registerToolbarButtons(
  panel: NotebookPanel
): [ToolbarButton, ToolbarButton] {
  const pinButton = createPinOutputButton(panel.content);
  const removeButton = createRemoveOutputButton(panel.content);
  panel.toolbar.insertItem(
    10,
    'removePinnedOutputsLeavingOneOnSelection',
    removeButton
  );
  panel.toolbar.insertItem(10, 'pinOutputsOnSelection', pinButton);
  return [pinButton, removeButton];
}

function createPinOutputButton(notebook: Notebook) {
  return new ToolbarButton({
    className: 'lc-toolbar-button',
    label: '+',
    iconClass: 'fa fa-thumb-tack',
    tooltip: 'Pin Outputs',
    onClick: () => {
      pinOutputOnSelection(notebook);
    }
  });
}

function createRemoveOutputButton(notebook: Notebook) {
  return new ToolbarButton({
    className: 'lc-toolbar-button',
    label: '1',
    iconClass: 'fa fa-thumb-tack',
    tooltip: 'Remove Pinned Outputs Leaving One',
    onClick: () => {
      removeOutputOnSelection(notebook);
    }
  });
}
