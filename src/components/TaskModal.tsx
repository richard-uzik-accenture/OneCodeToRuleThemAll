import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TaskModalProps {
  mode: 'add' | 'edit';
  initial?: { title: string };
  onSubmit: (values: { title: string }) => void;
  onClose: () => void;
}

export function TaskModal({ mode, initial, onSubmit, onClose }: TaskModalProps) {
  const [value, setValue] = useState(initial?.title ?? '');
  const reducedMotion = useReducedMotion();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onSubmit({ title });
  }

  return (
    <motion.div
      className="modal-scrim"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
        exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }}
      >
        <label className="modal-label" htmlFor="task-modal-input">
          {mode === 'add' ? 'what needs doing?' : 'edit this'}
        </label>
        <input
          id="task-modal-input"
          className="modal-input"
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. call the plumber back"
        />
        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>cancel</button>
          <button type="submit" className="modal-submit">{mode === 'add' ? 'add task' : 'save'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
