import { extensionId } from './plugin';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
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
  notebooks: INotebookTracker,
  commandPalette: ICommandPalette
): void {
  const category = 'Notebook';

  createCommands(app, notebooks).forEach(([id, options]) => {
    const command = extensionId + ':' + id;
    app.commands.addCommand(command, options);
    commandPalette.addItem({ command, category });
  });
}

function createCommands(
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions][] {
  return [
    createPinOutputOnSelectionCommand(app, notebooks),
    createRemoveOutputOnSelectionCommand(app, notebooks),
    createPinOutputInBelowSectionCommand(app, notebooks),
    createRemoveOutputInBelowSectionCommand(app, notebooks),
    createPinOutputInBelowAllCommand(app, notebooks),
    createRemoveOutputInBelowAllCommand(app, notebooks)
  ];
}

function createPinOutputOnSelectionCommand(
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-on-selection',
    {
      label: 'Pin Outputs On Selection',
      caption: 'Pin Outputs On Selection',
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
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-on-selection',
    {
      label: 'Remove Outputs On Selection',
      caption: 'Remove Outputs On Selection',
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
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-in-below-section',
    {
      label: 'Pin Outputs In Below Section',
      caption: 'Pin Outputs In Below Section',
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
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-in-below-section',
    {
      label: 'Remove Outputs In Below Section',
      caption: 'Remove Outputs In Below Section',
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
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'pin-outputs-in-below-all',
    {
      label: 'Pin Outputs In Below All',
      caption: 'Pin Outputs In Below All',
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
  notebooks: INotebookTracker
): [string, CommandRegistry.ICommandOptions] {
  return [
    'remove-outputs-in-below-all',
    {
      label: 'Remove Outputs In Below All',
      caption: 'Remove Outputs In Below All',
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
