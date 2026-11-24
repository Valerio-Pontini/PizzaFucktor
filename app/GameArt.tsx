import './GameArt.css';
import type { ReactNode } from 'react';

export type GameItem =
  | 'pizza'
  | 'coppia'
  | 'locale'
  | 'coppa'
  | 'mappa'
  | 'medaglia';

export function GameIcon({
  item,
  size = 36,
}: {
  item: GameItem;
  size?: number;
}) {
  return (
    <img
      className="game-icon"
      src={`/assets/festival/${item}.webp`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}

export function GameBrand() {
  return (
    <span className="game-brand">
      <GameIcon item="pizza" size={46} />
      <span>
        Pizza <b>Fucktor</b>
      </span>
    </span>
  );
}

export function GameHeader({ children }: { children: ReactNode }) {
  return (
    <header className="game-header">
      <GameBrand />
      <div className="game-header__actions">{children}</div>
    </header>
  );
}

export function Gamepad() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="16"
      viewBox="0 0 24 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10c3 0 4 3 5 9 .7 4-2 5-4 3l-3-3H9l-3 3c-2 2-5 1-4-3 1-6 2-9 5-9Z" />
      <path d="M7 6v4M5 8h4" />
      <circle cx="16" cy="7" r=".6" />
      <circle cx="18.5" cy="9" r=".6" />
    </svg>
  );
}
