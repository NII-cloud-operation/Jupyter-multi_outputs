import { OutputArea } from '@jupyterlab/outputarea';
import { PartialJSONObject } from '@lumino/coreutils';

export function getOutputText(outputArea: OutputArea): string {
  const outputs = outputArea.model.toJSON();
  return outputs
    .map(output => {
      if (output.data && (output.data as PartialJSONObject)['text/plain']) {
        return (output.data as PartialJSONObject)['text/plain'];
      }
      if (output.output_type === 'stream') {
        return output.text;
      }
      if (output.output_type === 'error') {
        return output.traceback?.toString();
      }
    })
    .join('\n');
}
