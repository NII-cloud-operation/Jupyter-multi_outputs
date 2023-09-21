import { PinnedOutput } from './pinned-outputs';
import { ICellModel } from '@jupyterlab/cells';

const tabsKey = 'pinned_outputs';
const tabIndexKey = 'pinnedOutputTabIndex';

/**
 * 指定した個数を残して古い出力を削除する
 * @param metadata
 * @param rest 残す個数
 */
export function leaveLatestPinnedOutputs(
  model: ICellModel,
  rest: number
): void {
  const outputs = getPinnedOutputs(model);
  setPinnedOutputs(model, latest(rest, outputs));
}

export function getPinnedOutputs(model: ICellModel): PinnedOutput[] {
  return (model.getMetadata(tabsKey) || []) as PinnedOutput[];
}

export function setPinnedOutputs(
  model: ICellModel,
  outputs: PinnedOutput[]
): void {
  model.setMetadata(tabsKey, outputs);
}

function latest<T>(n: number, items: T[]): T[] {
  return items.splice(-n);
}

export function resetPinnedOutputs(model: ICellModel): void {
  model.deleteMetadata(tabsKey);
}

export function getOutputTabIndex(model: ICellModel): number {
  return Number(model.getMetadata(tabIndexKey) || 0);
}

export function setOutputTabIndex(
  model: ICellModel,
  value: number
): void {
  model.setMetadata(tabIndexKey, value);
}

export function selectCurrentOutputTab(model: ICellModel): void {
  setOutputTabIndex(model, 0);
}

export function selectLatestOutputTab(model: ICellModel): void {
  setOutputTabIndex(model, 1);
}
