import { TEAM_MANIFEST, teamForSlot } from './team-manifest';
import type { TeamManifestEntry } from './team-manifest';

export const TEAM_BADGES = TEAM_MANIFEST;

export type { CharacterPose, CharacterSide, TeamAction, TeamArtId, TeamManifestEntry } from './team-manifest';

export { teamCharacterAsset, teamCharacterSoloAsset, teamPoseForAction, teamVoteArtIdForSlot } from './team-manifest';

export function teamBadgeForSlot(slot: number): TeamManifestEntry {
  return teamForSlot(slot);
}

export function TeamBadgeIcon({ slot, className = '' }: { slot: number; className?: string }) {
  const badge = teamBadgeForSlot(slot);
  return <img className={className} src={badge.badgeImage} alt="" aria-hidden="true" />;
}
