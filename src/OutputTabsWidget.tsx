import React from 'react';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { OutputTabs } from './components/OutputTabs';
import { CodeCell } from '@jupyterlab/cells';
import {
  getOutputTabIndex,
  selectCurrentOutputTab,
  getPinnedOutputs,
  resetPinnedOutputs,
  setPinnedOutputs
} from './outputUtils';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { Widget } from '@lumino/widgets';
import { showOutputAreaDiffDialog } from './showOutputAreaDiffDialog';
import $ from 'jquery';

export class OutputTabsWidget extends ReactWidget {
  constructor(private cell: CodeCell) {
    super();
  }

  render(): JSX.Element {
    return (
      <UseSignal signal={this.cell.model.metadataChanged}>
        {(_, args) => {
          const tabs = createTabs(this.cell);
          if(args != null && args.key == "scrolled") {
            // スクロールの変更の場合は最初のタブを選択状態にする
            selectCurrentOutputTab(this.cell.model);
          }
          const selectedIndex = getOutputTabIndex(this.cell.model);
          if (tabs.length > 1) {
            return <OutputTabs tabs={tabs} selectedIndex={selectedIndex} />;
          } else {
            return (
              <div
                ref={el => {
                  const outputWrapper = this.cell.outputArea.parent;
                  if (el && outputWrapper) {
                    el.innerHTML = '';
                    el.appendChild(outputWrapper.node);
                  }
                }}
              />
            );
          }
        }}
      </UseSignal>
    );
  }
}

export class PinButtonWidget extends ReactWidget {
  constructor(private onClick: () => unknown) {
    super();
    this.addClass('OutputArea-pinButton');
  }

  render(): JSX.Element {
    return <PinButton onClick={this.onClick} />;
  }
}

function PinButton({ onClick }: { onClick: () => unknown }): JSX.Element {
  //! Lib4.xでは上階層に"jp-OutputArea-promptOverlay"が追加されたため、z-indexを指定してボタンを押せるようにする
  return (
    <div className="multi-outputs-ui">
      <div className="buttons">
        <button type="button" className="btn btn-default" style={{position: 'relative', zIndex: 10000}} onClick={onClick}>
          <i className="fa fa-fw fa-thumb-tack" />
        </button>
      </div>
    </div>
  );
}

export function outputAreaWithPinButton(
  outputArea: OutputArea,
  onClick: () => unknown
): OutputArea {
  const prompt = outputArea.node.querySelector('.jp-OutputPrompt');
  if (prompt && !prompt.querySelector('.OutputArea-pinButton')) {
    Widget.attach(new PinButtonWidget(onClick), prompt as HTMLElement);
  }
  // outputがない場合はpromptも取れない

  return outputArea;
}

function removePinnedOutput(cell: CodeCell, executionCount: number) {
  const outputs = getPinnedOutputs(cell.model);
  const index = outputs.findIndex(o => o.execution_count === executionCount);
  if (index < 0) {
    return;
  }
  outputs.splice(index, 1);
  // setだけだとなぜかmetadata.changedが発火されないので一旦削除して作り直す
  resetPinnedOutputs(cell.model);
  setPinnedOutputs(cell.model, outputs);

  console.debug('metadata:', getPinnedOutputs(cell.model));
}

function outputAreaWithMergeButton(
  outputArea: OutputArea,
  onClick: () => unknown
): OutputArea {
  const prompt = outputArea.node.querySelector('.jp-OutputPrompt');
  if (!prompt) {
    throw new Error('prompt is not set.');
  }

  const container = $('<div/>')
    .addClass('multi-outputs-diff-ui')
    .appendTo(prompt);

  const btn = $('<div/>')
    .addClass('buttons')
    .attr('type', 'button')
    .append('<button class="btn btn-default"/>')
    .appendTo(container);

  const clickable = btn.find('button');
  $('<i class="fa fa-fw fa-exchange"/>').appendTo(clickable);
  clickable.on('click', onClick);

  return outputArea;
}

function createTabs(cell: CodeCell) {
  return [
    {
      name: 'output-current',
      label: '*',
      outputNode: cell.outputArea.parent?.node
    },
    ...getPinnedOutputs(cell.model)
      .map(output => {
        const outputArea = new OutputArea({
          model: new OutputAreaModel({
            values: output.outputs,
            trusted: !!cell.model.getMetadata('trusted')
          }),
          rendermime: cell.outputArea.rendermime
        });
        return {
          name: `output-${output.execution_count}`,
          label: `Out [${output.execution_count}]`,
          outputNode: outputAreaWithMergeButton(outputArea, () => {
            showOutputAreaDiffDialog(cell, output.execution_count, outputArea);
          }).node,
          onClose: () => {
            removePinnedOutput(cell, output.execution_count);
          }
        };
      })
      .reverse()
  ];
}
