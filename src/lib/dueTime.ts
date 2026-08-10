export function formatDueTime(due: string | null): string | null {
  if (!due) return null;
  const [hStr, mStr] = due.split(':');
  const hours24 = Number(hStr);
  const minutes = Number(mStr);
  const period = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return minutes === 0 ? `${hours12}${period}` : `${hours12}:${String(minutes).padStart(2, '0')}${period}`;
}

export function isPast(due: string | null, now = new Date()): boolean {
  if (!due) return false;
  const [hStr, mStr] = due.split(':');
  const dueMinutes = Number(hStr) * 60 + Number(mStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= dueMinutes;
}

export function dueLabel(due: string | null, now = new Date()): string | null {
  const formatted = formatDueTime(due);
  if (!formatted) return null;
  return isPast(due, now) ? `was ${formatted}` : formatted;
}
