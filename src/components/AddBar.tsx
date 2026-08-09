import { useState, type FormEvent } from 'react';

interface AddBarProps {
  onAdd: (title: string) => void;
}

export function AddBar({ onAdd }: AddBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        gap: 8,
        padding: 12,
        background: 'var(--paper)',
        borderTop: `1px solid var(--haze)`,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="what needs doing?"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 999,
          border: `1px solid var(--haze)`,
          background: 'var(--mist)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--violet)',
          color: 'var(--paper)',
          fontFamily: 'var(--font-body)',
        }}
      >
        add
      </button>
    </form>
  );
}
