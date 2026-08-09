import type { SVGProps } from 'react';

/** The reflow mark — bars settling around the coral circle. See branding.md §1, Concept B. */
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 118 118" fill="none" {...props}>
      <rect width="118" height="118" rx="26" fill="#171335" />
      <circle cx="80" cy="61" r="14" fill="#FF6B4A" />
      <rect x="24" y="23" width="70" height="6" rx="3" fill="#FAF9FB" />
      <rect x="24" y="37" width="70" height="6" rx="3" fill="#FAF9FB" />
      <rect x="24" y="51" width="36" height="6" rx="3" fill="#FAF9FB" />
      <rect x="24" y="65" width="36" height="6" rx="3" fill="#FAF9FB" />
      <rect x="24" y="79" width="70" height="6" rx="3" fill="#FAF9FB" />
    </svg>
  );
}
