import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { pluginId } from './plugin';
import { config } from './config';

export function useSettings(settings: ISettingRegistry): void {
  settings.load(pluginId).then(loadedSettings => {
    setSettings(loadedSettings);
    loadedSettings.changed.connect(() => setSettings(loadedSettings));
  });
}

function setSettings(settings: ISettingRegistry.ISettings): void {
  config.maxPinnedOutputs = settings.get('maxPinnedOutputs')
    .composite as number;
  console.debug('settings set:', config);
}
