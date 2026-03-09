import { ToolbarButton } from '@jupyterlab/apputils';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { TranslationBundle } from '@jupyterlab/translation';
import { pinOutputOnSelection, removeOutputOnSelection } from './actions';

export function registerToolbarButtons(
  trans: TranslationBundle,
  panel: NotebookPanel
): [ToolbarButton, ToolbarButton] {
  const pinButton = createPinOutputButton(trans, panel.content);
  const removeButton = createRemoveOutputButton(trans, panel.content);
  panel.toolbar.insertItem(
    10,
    'removePinnedOutputsLeavingOneOnSelection',
    removeButton
  );
  panel.toolbar.insertItem(10, 'pinOutputsOnSelection', pinButton);
  return [pinButton, removeButton];
}

function createPinOutputButton(trans: TranslationBundle, notebook: Notebook) {
  return new ToolbarButton({
    className: 'lc-toolbar-button',
    label: '+',
    iconClass: 'fa fa-thumb-tack',
    tooltip: trans.__('Pin Outputs'),
    onClick: () => {
      pinOutputOnSelection(notebook);
    }
  });
}

function createRemoveOutputButton(
  trans: TranslationBundle,
  notebook: Notebook
) {
  return new ToolbarButton({
    className: 'lc-toolbar-button',
    label: '1',
    iconClass: 'fa fa-thumb-tack',
    tooltip: trans.__('Remove Pinned Outputs Leaving One'),
    onClick: () => {
      removeOutputOnSelection(notebook);
    }
  });
}
