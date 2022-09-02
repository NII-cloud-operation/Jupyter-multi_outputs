import React from 'react';
import { CloseButton } from './CloseButton';

export type Props = {
  name: string;
  label: string;
  onClose?: () => unknown;
};

export function OutputTab({ name, label, onClose }: Props): JSX.Element {
  return (
    <li id={`tab-${name}`}>
      {onClose && <CloseButton onClick={onClose} />}
      <a href={`#${name}`}>{label}</a>
    </li>
  );
}
