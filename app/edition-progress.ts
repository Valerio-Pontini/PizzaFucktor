import { EDITION_ID, REQUIRED_BALLOTS, editionIsFinal, type EditionProgress } from './competition';
import { EDITION_PROGRESS_CTES } from './edition-progress-sql.mjs';

type ProgressRow = {
  teams: number;
  pizzerias: number;
  participants: number;
  completeTeams: number;
  submittedVotes: number;
  requiredVotes: number;
  isFinal: number;
};

export async function readEditionProgress(db: D1Database): Promise<EditionProgress> {
  const result = await db.prepare(`${EDITION_PROGRESS_CTES} SELECT * FROM edition_progress_row`)
    .bind(EDITION_ID)
    .first<ProgressRow>();

  const counts = {
    teams: Number(result?.teams ?? 0),
    pizzerias: Number(result?.pizzerias ?? 0),
    participants: Number(result?.participants ?? 0),
    completeTeams: Number(result?.completeTeams ?? 0),
    submittedVotes: Number(result?.submittedVotes ?? 0),
  };
  return {
    ...counts,
    requiredVotes: Number(result?.requiredVotes ?? REQUIRED_BALLOTS),
    isFinal: editionIsFinal(counts),
  };
}
