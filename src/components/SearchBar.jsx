import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search-bar" onSubmit={submit}>
      <input
        type="text"
        value={query}
        placeholder="Search recipes (e.g. chicken, pasta, samosa)..."
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">🔍 Search</button>
    </form>
  );
}