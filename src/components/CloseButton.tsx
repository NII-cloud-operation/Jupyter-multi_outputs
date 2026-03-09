import React from 'react';

type Props = { onClick: () => unknown };

export function CloseButton({ onClick }: Props): JSX.Element {
  return (
    <button
      type="button"
      className="ui-button ui-corner-all ui-widget ui-button-icon-only"
      onClick={onClick}
    >
      <span className="ui-button-icon ui-icon ui-icon-circle-close"></span>
      <span className="ui-button-icon-space"></span>
    </button>
  );
}
