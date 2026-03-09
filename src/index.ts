import { pluginId } from './plugin';
import { INotebookTracker } from '@jupyterlab/notebook';
import { OutputTabExtension } from './OutputTabExtension';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ITranslator } from '@jupyterlab/translation';

import 'jquery-ui/ui/widgets/tabs';
import 'jquery-ui/ui/widgets/button';

import diff from 'diff-match-patch';
import { useColorPrompt } from './useColorPrompt';
import { ICommandPalette } from '@jupyterlab/apputils';
import { registerCommands } from './commands';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { useSettings } from './useSettings';
import { useOutputTabs } from './useOutputTabs';
Object.keys(diff).forEach(key => {
  (window as any)[key] = (diff as any)[key];
});

/**
 * Initialization data for the lc_multi_outputs extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: pluginId,
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker, ISettingRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    notebooks: INotebookTracker,
    settings: ISettingRegistry,
    translator: ITranslator
  ) => {
    console.debug('JupyterLab extension lc_multi_outputs is activated!');
    const trans = translator.load('lc_multi_outputs');

    useSettings(settings);
    useColorPrompt();
    useOutputTabs();
    registerCommands(app, trans, notebooks, palette);

    app.docRegistry.addWidgetExtension(
      'Notebook',
      new OutputTabExtension(trans)
    );
  }
};

export default plugin;
