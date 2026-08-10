import type { SVGProps } from 'react';

export function Clock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth={1.75} />
      <path d="M12 7.5 L12 12 L15.25 14" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
