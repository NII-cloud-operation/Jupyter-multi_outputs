import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the lc_multi_outputs extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'lc_multi_outputs:plugin',
  description: 'Multiple outputs as tabs',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension lc_multi_outputs is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('lc_multi_outputs settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for lc_multi_outputs.', reason);
        });
    }
  }
};

export default plugin;
