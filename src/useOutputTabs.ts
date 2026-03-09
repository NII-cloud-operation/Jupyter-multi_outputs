import { NotebookActions } from '@jupyterlab/notebook';
import { selectCurrentOutputTab } from './outputUtils';

export function useOutputTabs(): void {
  NotebookActions.executed.connect((_, { cell }) => {
    selectCurrentOutputTab(cell.model);
  });
}
