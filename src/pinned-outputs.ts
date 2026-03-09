import { IOutput } from '@jupyterlab/nbformat';

export type PinnedOutput = {
  execution_count: number;
  outputs: IOutput[];
};
