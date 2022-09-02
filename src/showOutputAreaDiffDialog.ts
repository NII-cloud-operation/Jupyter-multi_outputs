import { Dialog, showDialog } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';
import { OutputArea } from '@jupyterlab/outputarea';
import { MergeWidget } from './MergeWidget';
import { getOutputText } from './getOutputText';

export function showOutputAreaDiffDialog(
  cell: CodeCell,
  pinnedExecutionCount: number,
  pinnedOutputArea: OutputArea
): void {
  const value = getOutputText(cell.outputArea);
  const orig = getOutputText(pinnedOutputArea);
  showDiffDialog(
    value,
    orig,
    String(cell.model.executionCount || '*'),
    String(pinnedExecutionCount)
  );
}

function showDiffDialog(
  value: string,
  other: string,
  label: string,
  otherLabel: string
) {
  if (value === '' && other === '') {
    console.debug('no output');
    return;
  }
  showDialog({
    title: `Diff: Out[${label}] <- Out[${otherLabel}]`,
    body: new MergeWidget(value, other),
    buttons: [Dialog.cancelButton({ label: '閉じる' })]
  });
}
