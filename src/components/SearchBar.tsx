import React, { FormEvent } from 'react';
import { TranslationBundle } from '@jupyterlab/translation';

export type SearchBarProps = {
  trans: TranslationBundle;
  onSubmit: (data: { keyword: string }) => void;
};

export function SearchBar({ trans, onSubmit }: SearchBarProps): JSX.Element {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onSubmit({
      keyword: String(data.get('keyword') || '')
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="keyword">{trans.__('Search: ')}</label>
      <input type="text" id="keyword" name="keyword" />
      <input type="submit" value={trans.__('Search')} />
    </form>
  );
}
