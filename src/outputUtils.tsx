import { IObservableJSON } from '@jupyterlab/observables';
import { PinnedOutput } from './pinned-outputs';

const tabsKey = 'pinned_outputs';
const tabIndexKey = 'pinnedOutputTabIndex';

/**
 * 指定した個数を残して古い出力を削除する
 * @param metadata
 * @param rest 残す個数
 */
export function leaveLatestPinnedOutputs(
  metadata: IObservableJSON,
  rest: number
): void {
  const outputs = getPinnedOutputs(metadata);
  setPinnedOutputs(metadata, latest(rest, outputs));
}

export function getPinnedOutputs(metadata: IObservableJSON): PinnedOutput[] {
  return (metadata.get(tabsKey) || []) as PinnedOutput[];
}

export function setPinnedOutputs(
  metadata: IObservableJSON,
  outputs: PinnedOutput[]
): void {
  metadata.set(tabsKey, outputs);
}

function latest<T>(n: number, items: T[]): T[] {
  return items.splice(-n);
}

export function resetPinnedOutputs(metadata: IObservableJSON): void {
  metadata.delete(tabsKey);
}

export function getOutputTabIndex(metadata: IObservableJSON): number {
  return Number(metadata.get(tabIndexKey) || 0);
}

export function setOutputTabIndex(
  metadata: IObservableJSON,
  value: number
): void {
  metadata.set(tabIndexKey, value);
}

export function selectCurrentOutputTab(metadata: IObservableJSON): void {
  setOutputTabIndex(metadata, 0);
}

export function selectLatestOutputTab(metadata: IObservableJSON): void {
  setOutputTabIndex(metadata, 1);
}
