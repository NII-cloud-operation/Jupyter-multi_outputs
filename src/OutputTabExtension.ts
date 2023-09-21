import { Widget } from '@lumino/widgets';
import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { CodeCell, isCodeCellModel } from '@jupyterlab/cells';

import { outputAreaWithPinButton, OutputTabsWidget } from './OutputTabsWidget';
import { pinOutput } from './pinOutput';
import { registerToolbarButtons } from './toolbar';

export class OutputTabExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
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
              if(isAttached) {
                initCell(cell as CodeCell);
              }
            });
          }
        });
      }
    });

    const toolbarButtons = registerToolbarButtons(panel);

    return new DisposableDelegate(() => {
      toolbarButtons.forEach(b => b.dispose());
    });
  }
}

function initCell(cell: CodeCell) {
  initOutputTabs(cell);
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

function initOutputTabs(cell: CodeCell) {
  Widget.attach(new OutputTabsWidget(cell), cell.node);
}

function getCellByModelId(notebook: Notebook, cellModelId: string) {
  return notebook.widgets.find(c => c.model.id === cellModelId);
}
