import { extensionId } from './plugin';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import {
  pinOutputsInBelowSection,
  pinOutputOnSelection,
  removeOutputsInBelowSection,
  removeOutputOnSelection,
  pinOutputsInBelowAll,
  removeOutputsInBelowAll
} from './actions';

export function registerCommands(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker,
  commandPalette: ICommandPalette
): void {
  const category = 'Notebook';

  createCommands(app, trans, notebooks).forEach(([id, options]) => {
    const command = extensionId + ':' + id;
    app.commands.addCommand(command, options);
    commandPalette.addItem({ command, category });
  });
}

function createCommands(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions][] {
  return [
    createPinOutputOnSelectionCommand(app, trans, notebooks),
    createRemoveOutputOnSelectionCommand(app, trans, notebooks),
    createPinOutputInBelowSectionCommand(app, trans, notebooks),
    createRemoveOutputInBelowSectionCommand(app, trans, notebooks),
    createPinOutputInBelowAllCommand(app, trans, notebooks),
    createRemoveOutputInBelowAllCommand(app, trans, notebooks)
  ];
}

function createPinOutputOnSelectionCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-on-selection',
    {
      label: trans.__('Pin Outputs On Selection'),
      caption: trans.__('Pin Outputs On Selection'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          pinOutputOnSelection(current.content);
        }
      }
    }
  ];
}

function createRemoveOutputOnSelectionCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-on-selection',
    {
      label: trans.__('Remove Outputs On Selection'),
      caption: trans.__('Remove Outputs On Selection'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          removeOutputOnSelection(current.content);
        }
      }
    }
  ];
}

function createPinOutputInBelowSectionCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-in-below-section',
    {
      label: trans.__('Pin Outputs In Below Section'),
      caption: trans.__('Pin Outputs In Below Section'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          pinOutputsInBelowSection(current.content);
        }
      }
    }
  ];
}

function createRemoveOutputInBelowSectionCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-in-below-section',
    {
      label: trans.__('Remove Outputs In Below Section'),
      caption: trans.__('Remove Outputs In Below Section'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          removeOutputsInBelowSection(current.content);
        }
      }
    }
  ];
}

function createPinOutputInBelowAllCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-in-below-all',
    {
      label: trans.__('Pin Outputs In Below All'),
      caption: trans.__('Pin Outputs In Below All'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          pinOutputsInBelowAll(current.content);
        }
      }
    }
  ];
}

function createRemoveOutputInBelowAllCommand(
  app: JupyterFrontEnd,
  trans: TranslationBundle,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-in-below-all',
    {
      label: trans.__('Remove Outputs In Below All'),
      caption: trans.__('Remove Outputs In Below All'),
      execute: () => {
        const current = getCurrentNotebookPanel(app, notebooks);
        if (current) {
          removeOutputsInBelowAll(current.content);
        }
      }
    }
  ];
}

function getCurrentNotebookPanel(
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
) {
  return notebooks.find(
    panel =>
      !!app.shell.currentWidget && panel.id === app.shell.currentWidget.id
  );
}
