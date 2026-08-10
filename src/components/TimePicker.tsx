import { useRef, useState, type KeyboardEvent, type WheelEvent } from 'react';
import { Clock } from './icons/Clock';

interface TimePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function parse(value: string): { hour12: number; minute: number; period: 'am' | 'pm' } {
  if (!value) return { hour12: 9, minute: 0, period: 'am' };
  const [hStr, mStr] = value.split(':');
  const hour24 = Number(hStr);
  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute: Number(mStr), period };
}

function toValue(hour12: number, minute: number, period: 'am' | 'pm'): string {
  const hour24 = period === 'am' ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function wrap(n: number, max: number): number {
  return ((n % max) + max) % max;
}

export function TimePicker({ id, value, onChange }: TimePickerProps) {
  const [hourDraft, setHourDraft] = useState<string | null>(null);
  const [minuteDraft, setMinuteDraft] = useState<string | null>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const { hour12, minute, period } = parse(value);
  const isSet = value !== '';

  function set(next: Partial<{ hour12: number; minute: number; period: 'am' | 'pm' }>) {
    onChange(toValue(next.hour12 ?? hour12, next.minute ?? minute, next.period ?? period));
  }

  function stepHour(delta: number) {
    set({ hour12: wrap(hour12 - 1 + delta, 12) + 1 });
  }

  function stepMinute(delta: number) {
    set({ minute: wrap(minute + delta, 60) });
  }

  function handleHourKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') { e.preventDefault(); stepHour(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepHour(-1); }
    else if (e.key === 'ArrowRight' || e.key === ':') { e.preventDefault(); minuteRef.current?.focus(); minuteRef.current?.select(); }
  }

  function handleMinuteKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') { e.preventDefault(); stepMinute(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepMinute(-1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); hourRef.current?.focus(); hourRef.current?.select(); }
  }

  function handleHourInput(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setHourDraft(digits);
    if (digits === '') return;
    const n = Number(digits);
    if (n > 12) {
      set({ hour12: n % 10 || 1 });
      setHourDraft(null);
      minuteRef.current?.focus();
      minuteRef.current?.select();
      return;
    }
    set({ hour12: n === 0 ? 12 : n });
    if (digits.length >= 2) {
      setHourDraft(null);
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
  }

  function handleMinuteInput(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setMinuteDraft(digits);
    if (digits === '') return;
    const n = Number(digits);
    if (n > 59) {
      set({ minute: n % 10 });
      setMinuteDraft(null);
      return;
    }
    set({ minute: n });
    if (digits.length >= 2) setMinuteDraft(null);
  }

  function handleWheel(e: WheelEvent<HTMLInputElement>, step: (delta: number) => void) {
    e.preventDefault();
    step(e.deltaY > 0 ? -1 : 1);
  }

  return (
    <div className="time-picker">
      <div className="time-picker-field" role="group" aria-label="due time">
        <Clock className="time-picker-icon" width={16} height={16} />
        <input
          ref={hourRef}
          id={id}
          className="time-picker-segment"
          type="text"
          inputMode="numeric"
          maxLength={2}
          aria-label="hour"
          value={hourDraft ?? String(hour12).padStart(2, '0')}
          placeholder="--"
          onChange={(e) => handleHourInput(e.target.value)}
          onKeyDown={handleHourKeyDown}
          onWheel={(e) => handleWheel(e, stepHour)}
          onFocus={(e) => e.target.select()}
          onBlur={() => setHourDraft(null)}
        />
        <span className="time-picker-colon">:</span>
        <input
          ref={minuteRef}
          className="time-picker-segment"
          type="text"
          inputMode="numeric"
          maxLength={2}
          aria-label="minute"
          value={minuteDraft ?? String(minute).padStart(2, '0')}
          placeholder="--"
          onChange={(e) => handleMinuteInput(e.target.value)}
          onKeyDown={handleMinuteKeyDown}
          onWheel={(e) => handleWheel(e, stepMinute)}
          onFocus={(e) => e.target.select()}
          onBlur={() => setMinuteDraft(null)}
        />
        <button
          type="button"
          className="time-picker-period"
          aria-label={`switch to ${period === 'am' ? 'pm' : 'am'}`}
          onClick={() => set({ period: period === 'am' ? 'pm' : 'am' })}
        >
          {period}
        </button>
      </div>
      {isSet && (
        <button type="button" className="due-time-clear" onClick={() => onChange('')}>
          clear
        </button>
      )}
    </div>
  );
}
