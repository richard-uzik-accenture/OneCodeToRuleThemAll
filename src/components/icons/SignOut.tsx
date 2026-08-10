import type { SVGProps } from 'react';

export function SignOut(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M10 5 L5 5 L5 19 L10 19" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12 L20 12 M20 12 L16 8 M20 12 L16 16" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
