'use client';

import type { CSSProperties, ReactNode } from 'react';
import { GameIcon, type GameItem } from './GameArt';
import { TeamBadgeIcon, teamBadgeForSlot } from './team-badges';

const sceneIcons: Record<string, GameItem> = { home: 'mappa', appointments: 'locale', votes: 'coppa', history: 'medaglia', vote: 'medaglia', team: 'coppia', pizzeria: 'locale', restaurant: 'locale', 'restaurant-detail': 'pizza' };

type SceneShellProps = {
  scene: string;
  chapter: string;
  title?: string;
  progress?: string;
  arrival?: string;
  arrivalSlot?: number;
  arrivalTeamName?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
};

export function SceneShell({
  scene,
  chapter,
  title,
  progress,
  arrival,
  arrivalSlot,
  arrivalTeamName,
  onBack,
  backLabel = 'Torna alla piazza',
  children,
}: SceneShellProps) {
  const arrivalBadge = arrivalSlot ? teamBadgeForSlot(arrivalSlot) : null;

  return (
    <section className={`scene-shell scene-shell--${scene}`} data-scene={scene} data-arrival={arrival} aria-label={title ?? chapter}>
      {scene === 'votes' ? (
        <div className="scene-shell__set-piece scene-shell__set-piece--vote" aria-hidden="true">
          <img src="/assets/vote-kit/renders/pizza_cinque_gusti.webp" alt="" />
          <span>IL PIATTO<br />DEI VERDETTI</span>
        </div>
      ) : null}
      {arrival === 'team-launch' && arrivalBadge ? (
        <div
          className="scene-shell__arrival"
          style={{ '--team-accent': arrivalBadge.accent, '--team-dark': arrivalBadge.dark, '--team-rgb': arrivalBadge.rgb } as CSSProperties}
          aria-live="polite"
        >
          <span className="scene-shell__arrival-beacon" aria-hidden="true" />
          <span className="scene-shell__arrival-badge" aria-hidden="true"><TeamBadgeIcon slot={arrivalBadge.slot} /></span>
          <div className="scene-shell__arrival-copy">
            <span>IL GIRO SI ACCENDE</span>
            <strong>{arrivalTeamName || arrivalBadge.name}</strong>
            <small>Il badge è arrivato in piazza.</small>
          </div>
        </div>
      ) : null}
      <div className="scene-shell__hud">
        <div className="scene-shell__route">
          <GameIcon item={sceneIcons[scene] ?? 'pizza'} size={38} />
          <div>
            <span className="scene-shell__chapter">{chapter}</span>
            {title ? <strong>{title}</strong> : null}
          </div>
        </div>
        <div className="scene-shell__hud-meta">
          {progress ? <span className="scene-shell__progress" aria-label={`Progresso: ${progress}`}>{progress} <small>coppie</small></span> : null}
          {onBack ? <button className="scene-shell__back" aria-label={backLabel} type="button" onClick={onBack}>← <span>{backLabel}</span></button> : null}
        </div>
      </div>
      <div className="scene-shell__transition" key={scene}>
        {children}
      </div>
    </section>
  );
}
