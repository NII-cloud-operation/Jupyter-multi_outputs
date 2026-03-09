import { config } from './config';
import { CodeCell } from '@jupyterlab/cells';
import {
  getPinnedOutputs,
  selectLatestOutputTab,
  setPinnedOutputs
} from './outputUtils';
import { PinnedOutput } from './pinned-outputs';

export function pinOutput(cell: CodeCell): void {
  if (cell.model.outputs.length === 0) {
    console.debug('no output');
    return;
  }
  if (!cell.model.executionCount) {
    console.debug('cell is running');
    return;
  }
  const outputs = getPinnedOutputs(cell.model);
  if (outputs.some(o => o.execution_count === cell.model.executionCount)) {
    console.debug('this output is already exist');
    return;
  }

  const values = cell.model.outputs.toJSON();
  const output: PinnedOutput = {
    execution_count: cell.model.executionCount,
    outputs: values
  };
  setPinnedOutputs(
    cell.model,
    [...outputs, output].splice(-config.maxPinnedOutputs)
  );
  selectLatestOutputTab(cell.model);

  console.debug('metadata:', getPinnedOutputs(cell.model));
}
