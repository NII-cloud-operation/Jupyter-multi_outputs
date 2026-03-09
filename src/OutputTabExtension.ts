import { Widget } from '@lumino/widgets';
import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { CodeCell, isCodeCellModel } from '@jupyterlab/cells';
import { TranslationBundle } from '@jupyterlab/translation';

import { outputAreaWithPinButton, OutputTabsWidget } from './OutputTabsWidget';
import { pinOutput } from './pinOutput';
import { registerToolbarButtons } from './toolbar';

export class OutputTabExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(private trans: TranslationBundle) {}

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): void | IDisposable {
    panel.content.model?.cells.changed.connect((_, change) => {
      if (change.type === 'add') {
        change.newValues.forEach(cellModel => {
          const cell = getCellByModelId(panel.content, cellModel.id);
          if (cell && isCodeCellModel(cellModel)) {
            cell.inViewportChanged.connect((_, isAttached) => {
              if (isAttached) {
                initCell(this.trans, cell as CodeCell);
              }
            });
          }
        });
      }
    });

    const toolbarButtons = registerToolbarButtons(this.trans, panel);

    return new DisposableDelegate(() => {
      toolbarButtons.forEach(b => b.dispose());
    });
  }
}

function initCell(trans: TranslationBundle, cell: CodeCell) {
  initOutputTabs(trans, cell);
  // アウトプットの初期化
  outputAreaWithPinButton(cell.outputArea, () => {
    pinOutput(cell);
  });
  // アウトプットの変更時
  cell.outputArea.model.changed.connect((_, args) => {
    if (args.type === 'add') {
      outputAreaWithPinButton(cell.outputArea, () => {
        pinOutput(cell);
      });
    }
  });
}

function initOutputTabs(trans: TranslationBundle, cell: CodeCell) {
  // Remove the old widget if the cell already has the widget
  const oldWidget = cell.node.querySelector('.multi-output-widget');
  if (oldWidget) {
    oldWidget.remove();
  }
  Widget.attach(new OutputTabsWidget(trans, cell), cell.node);
}

function getCellByModelId(notebook: Notebook, cellModelId: string) {
  return notebook.widgets.find(c => c.model.id === cellModelId);
}
