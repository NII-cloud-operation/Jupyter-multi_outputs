import React from 'react';
import { OutputTab } from './OutputTab';
import $ from 'jquery';

type Props = {
  tabs: {
    name: string;
    label: string;
    outputNode?: HTMLElement;
    onClose?: () => unknown;
  }[];
  selectedIndex?: number;
};

export function OutputTabs({ tabs, selectedIndex }: Props): JSX.Element {
  const container = React.useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = React.useState(false);

  // タブを初期化する
  React.useEffect(() => {
    const tabs = container.current;
    if (tabs) {
      ($(tabs) as any).tabs();
      if (selectedIndex) {
        ($(tabs) as any).tabs('option', 'active', selectedIndex);
      }
      setInitialized(true);
    }

    return () => {
      if (tabs) {
        ($(tabs) as any).tabs('destroy');
      }
    };
  }, [tabs]);
  // タブの位置を反映する
  React.useEffect(() => {
    const tabs = container.current;
    if (initialized && tabs && selectedIndex) {
      ($(tabs) as any).tabs('option', 'active', selectedIndex);
    }
  }, [selectedIndex]);

  return (
    <div className="multi-output-container" ref={container}>
      <div className="multi-output-tabs output_area">
        <div className="prompt out_prompt_bg"></div>
        <ul className="nav nav-tabs">
          {tabs.map(tab => (
            <OutputTab
              name={tab.name}
              label={tab.label}
              onClose={tab.onClose}
            />
          ))}
        </ul>
      </div>
      {tabs.map(tab => {
        return (
          <div
            id={tab.name}
            className="multi-output-wrapper"
            ref={el => {
              if (el && tab.outputNode) {
                el.innerHTML = '';
                el.appendChild(tab.outputNode);
              }
            }}
          />
        );
      })}
    </div>
  );
}
