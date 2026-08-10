import type { SVGProps } from 'react';

export function Share(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 15 L12 4 M7.5 8.5 L12 4 L16.5 8.5 M6 12 L6 19 Q6 20 7 20 L17 20 Q18 20 18 19 L18 12" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
