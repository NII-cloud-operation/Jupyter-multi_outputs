import React, { FormEvent } from 'react';

export function SearchBar({
  onSubmit
}: {
  onSubmit: (data: { keyword: string }) => unknown;
}): JSX.Element {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onSubmit({
      keyword: String(data.get('keyword') || '')
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="keyword">Search</label>
      <input type="text" id="keyword" name="keyword" />
      <input type="submit" value="検索" />
    </form>
  );
}
