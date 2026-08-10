import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TaskModal } from './TaskModal';
import { Plus } from './icons/Plus';

interface AddTaskFabProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddTaskFab({ onAdd, disabled }: AddTaskFabProps) {
  const [open, setOpen] = useState(false);

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

  function handleSubmit({ title }: { title: string }) {
    onAdd(title);
    setOpen(false);
  }

  return (
    <>
      <button aria-label="add task" className="fab" onClick={() => setOpen(true)} disabled={disabled}>
        <Plus width={24} height={24} />
      </button>
      <AnimatePresence>
        {open && <TaskModal mode="add" onSubmit={handleSubmit} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
