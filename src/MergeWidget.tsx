import React, { useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';

import { Editor, MergeView } from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/merge/merge';
import 'codemirror/addon/merge/merge.css';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/scroll/annotatescrollbar';
import { SearchBar } from './components/SearchBar';

export class MergeWidget extends ReactWidget {
  constructor(private value: string, private orig: string) {
    super();
  }

  render(): JSX.Element {
    return <MergePage value={this.value} orig={this.orig} />;
  }
}

export function MergePage({
  value,
  orig
}: {
  value: string;
  orig: string;
}): JSX.Element {
  const [search, setSearch] = React.useState('');
  return (
    <div>
      <Merge value={value} orig={orig} search={search} />
      <SearchBar onSubmit={data => setSearch(data.keyword)} />
    </div>
  );
}

export function Merge({
  value,
  orig,
  search
}: {
  value: string;
  orig: string;
  search: string;
}): JSX.Element {
  const valueEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!valueEl.current) {
      return;
    }
    valueEl.current.innerHTML = '';
    const mergeView = new MergeView(valueEl.current, {
      mode: 'text/plain',
      value: value,
      orig: orig,
      lineNumbers: true,
      revertButtons: false,
      lineWrapping: true,
      showDifferences: true
    });
    markText(mergeView.editor(), search);
    const right = mergeView.rightOriginal();
    if (right) {
      markText(right, search);
    }
  }, [valueEl, search]);

  return (
    <>
      <div ref={valueEl} style={{ minWidth: '75vw' }}></div>
    </>
  );
}

function markText(editor: Editor, query: string) {
  const searchCursor = editor.getSearchCursor(query, { ch: 0, line: 0 }, false);
  const options = { className: 'search-highlight' };
  editor.annotateScrollbar('search-highlight').clear();
  while (searchCursor.findNext()) {
    editor.markText(searchCursor.from(), searchCursor.to(), options);
  }
}
