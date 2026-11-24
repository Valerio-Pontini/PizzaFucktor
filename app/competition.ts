import { EDITION_CAPACITY, REQUIRED_BALLOTS, REQUIRED_PARTICIPANTS } from './edition-progress-sql.mjs';

export { EDITION_CAPACITY, EDITION_ID, REQUIRED_BALLOTS, REQUIRED_PARTICIPANTS } from './edition-progress-sql.mjs';

export type EditionProgress = {
  teams: number;
  pizzerias: number;
  participants: number;
  completeTeams: number;
  submittedVotes: number;
  requiredVotes: number;
  isFinal: boolean;
};

export function editionIsFinal(progress: Omit<EditionProgress, 'isFinal' | 'requiredVotes'>): boolean {
  return progress.teams === EDITION_CAPACITY
    && progress.pizzerias === EDITION_CAPACITY
    && progress.participants === REQUIRED_PARTICIPANTS
    && progress.completeTeams === EDITION_CAPACITY
    && progress.submittedVotes === REQUIRED_BALLOTS;
}

export type ScoredPlace = {
  teamId: string;
  teamName: string;
  slot: number;
  voteCount: number;
  totalScore: number;
  pizzeria: unknown;
  myVote: unknown;
};

export function rankCompetition<T extends ScoredPlace>(places: T[]) {
  const sorted = [...places].sort((left, right) => {
    if (left.voteCount === 0 && right.voteCount > 0) return 1;
    if (right.voteCount === 0 && left.voteCount > 0) return -1;
    if (left.voteCount > 0 && right.voteCount > 0 && left.totalScore !== right.totalScore) return right.totalScore - left.totalScore;
    return left.slot - right.slot;
  });

  let previous: T | undefined;
  let previousRank = 0;
  return sorted.map((place, index) => {
    const tiedWithPrevious = Boolean(previous && place.voteCount > 0 && previous.voteCount > 0
      && place.totalScore === previous.totalScore);
    const rank = place.voteCount === 0 ? null : tiedWithPrevious ? previousRank : index + 1;
    if (rank !== null) previousRank = rank;
    previous = place;
    return {
      ...place,
      rank,
    };
  });
}
