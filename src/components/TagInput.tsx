import { useState, type KeyboardEvent } from 'react';
import { addTag, removeTag, suggestTags } from '../lib/tags';
import { Close } from './icons/Close';

interface TagInputProps {
  value: string[];
  known: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, known, onChange }: TagInputProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = suggestTags(known, query, value);
  const showSuggestions = query.length > 0 && suggestions.length > 0;

  function commit(raw: string) {
    const next = addTag(value, raw);
    onChange(next);
    setQuery('');
    setActiveIndex(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0) {
        commit(suggestions[activeIndex]);
      } else if (query.trim()) {
        commit(query);
      }
      return;
    }
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Escape' && showSuggestions) {
      setActiveIndex(-1);
    }
  }

  return (
    <div className="tag-input">
      <div className="tag-input-field">
        {value.map((tag) => (
          <span key={tag} className="tag-chip tag-chip-removable">
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              aria-label={`remove tag ${tag}`}
              onClick={() => onChange(removeTag(value, tag))}
            >
              <Close width={10} height={10} />
            </button>
          </span>
        ))}
        <input
          id="task-modal-tags"
          type="text"
          className="tag-input-text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'add a tag' : ''}
          aria-expanded={showSuggestions}
          role="combobox"
          aria-controls="tag-suggest-listbox"
          aria-autocomplete="list"
        />
      </div>
      {showSuggestions && (
        <ul className="tag-suggest" id="tag-suggest-listbox" role="listbox" aria-live="polite">
          {suggestions.map((tag, i) => (
            <li
              key={tag}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'tag-suggest-active' : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(tag);
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
