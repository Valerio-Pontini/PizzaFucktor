'use client';

import type { CSSProperties } from 'react';
import { teamBadgeForSlot, teamCharacterAsset, teamCharacterSoloAsset } from './team-badges';
import { teamPoseForAction } from './team-manifest';
import type { CharacterPose, CharacterSide, TeamAction } from './team-manifest';
import './CharacterActor.css';

export type { CharacterPose } from './team-manifest';

type CharacterActorProps = {
  slot: number;
  pose?: CharacterPose;
  action?: TeamAction;
  solo?: CharacterSide;
  compact?: boolean;
  imageSizes?: string;
  label?: string;
  className?: string;
};

export function CharacterActor({ slot, pose = 'idle', action, solo, compact = false, imageSizes, label, className = '' }: CharacterActorProps) {
  const badge = teamBadgeForSlot(slot);
  const resolvedPose = action ? teamPoseForAction(slot, action) : pose;
  const image = solo ? teamCharacterSoloAsset(slot, solo) : teamCharacterAsset(slot, resolvedPose);
  const hasCompactImage = !solo && imageSizes && ['idle', 'cheer', 'tasting'].includes(resolvedPose);
  const classes = [
    'character-actor',
    `character-actor--${resolvedPose}`,
    compact ? 'character-actor--compact' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ '--actor-accent': badge.dark } as CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="character-actor__ground" />
      <img
        className="character-actor__image"
        src={image}
        srcSet={hasCompactImage ? `${image.replace(/\.webp$/, '-350.webp')} 350w, ${image} 1122w` : undefined}
        sizes={hasCompactImage ? imageSizes : undefined}
        decoding="async"
        alt=""
        draggable="false"
      />
    </div>
  );
}
