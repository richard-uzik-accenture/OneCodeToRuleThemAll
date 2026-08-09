import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from './icons/Plus';

interface AddTaskFabProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddTaskFab({ onAdd, disabled }: AddTaskFabProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '+' && e.key !== 'n') return;
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping || open || disabled) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, disabled]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
    setOpen(false);
  }

  return (
    <>
      <button aria-label="add task" className="fab" onClick={() => setOpen(true)} disabled={disabled}>
        <Plus width={24} height={24} />
      </button>
      {open && (
        <div className="modal-scrim" onClick={() => setOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <label className="modal-label" htmlFor="add-task-input">what needs doing?</label>
            <input
              id="add-task-input"
              className="modal-input"
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. call the plumber back"
            />
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setOpen(false)}>cancel</button>
              <button type="submit" className="modal-submit">add task</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
