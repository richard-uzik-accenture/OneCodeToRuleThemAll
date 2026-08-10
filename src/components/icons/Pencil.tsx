import type { SVGProps } from 'react';

export function Pencil(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 5 L19 9 M4 20 L5 15.5 L14 6.5 L17.5 10 L8.5 19 Z" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
