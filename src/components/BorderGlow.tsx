import { useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import './BorderGlow.css';

/**
 * A quiet, pointer-reactive edge light — adapted from the open-source BorderGlow
 * component and recolored to a single ink-violet hue (no rainbow mesh, no coral).
 * Reserved for pre-login surfaces; see branding.md §2 on why coral and gradients
 * stay off chrome. Never plays on its own — only reacts to actual pointer proximity.
 */
interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  borderRadius?: number;
  glowRadius?: number;
}

function getCenterOfElement(el: HTMLElement): [number, number] {
  const { width, height } = el.getBoundingClientRect();
  return [width / 2, height / 2];
}

function getEdgeProximity(el: HTMLElement, x: number, y: number): number {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function getCursorAngle(el: HTMLElement, x: number, y: number): number {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) return 0;
  const radians = Math.atan2(dy, dx);
  let degrees = radians * (180 / Math.PI) + 90;
  if (degrees < 0) degrees += 360;
  return degrees;
}

export function BorderGlow({
  children,
  className = '',
  edgeSensitivity = 35,
  borderRadius = 24,
  glowRadius = 32,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--edge-sensitivity': edgeSensitivity,
      } as React.CSSProperties}
    >
      <span className="border-glow-edge" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
