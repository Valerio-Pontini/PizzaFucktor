import { GameIcon } from './GameArt';
import { TeamBadgeIcon } from './team-badges';
import { CharacterActor } from './CharacterActor';
import type { CSSProperties } from 'react';
import './CompetitionBoard.css';

type Entry = {
  teamId: string;
  teamName: string;
  slot: number;
  pizzeria: { name: string; address: string; city: string };
  voteCount: number;
  totalScore: number;
  rank: number | null;
  isWinner: boolean;
  myVote: unknown;
};

type Props = {
  entries: Entry[];
  edition: { submittedVotes: number; requiredVotes: number; isFinal: boolean };
  compact?: boolean;
};

function FinalWinners({ entries, compact = false }: { entries: Entry[]; compact?: boolean }) {
  const winners = entries.filter((entry) => entry.isWinner);
  if (!winners.length) return null;
  return (
    <section className={`final-winners${compact ? ' final-winners--compact' : ''}`} aria-labelledby={compact ? 'home-winner-title' : 'votes-winner-title'}>
      <div className="final-winners__stamp"><GameIcon item="coppa" size={46} /></div>
      <div className="final-winners__copy">
        <p className="section-kicker">IL VERDETTO È SIGILLATO</p>
        <h3 id={compact ? 'home-winner-title' : 'votes-winner-title'}>{winners.length === 1 ? 'La fetta migliore.' : 'Una vittoria condivisa.'}</h3>
        <p>{winners.length === 1 ? 'La compagnia ha scelto la pizzeria vincitrice.' : 'La classifica finisce in parità: il podio è condiviso.'}</p>
      </div>
      <div className="final-winners__places">
        {winners.map((entry) => (
          <div className="final-winners__place" key={entry.teamId}>
            <TeamBadgeIcon slot={entry.slot} className="final-winners__badge" />
            <div><span>{entry.teamName}</span><strong>{entry.pizzeria.name}</strong></div>
            <b className="final-winners__score">{entry.totalScore}<small> punti</small></b>
          </div>
        ))}
      </div>
    </section>
  );
}

function PodiumScene({ entries, edition, compact = false }: { entries: Entry[]; edition: Props['edition']; compact?: boolean }) {
  const slots = [2, 1, 3].map((rank) => ({ rank, places: entries.filter((entry) => entry.rank === rank) }));
  const offPodium = edition.isFinal ? entries.filter((entry) => entry.rank !== null && entry.rank > 3) : [];
  const waiting = entries.filter((entry) => entry.rank === null);

  return (
    <div className={`competition-board__scene${edition.isFinal ? ' competition-board__scene--final' : ''}${compact ? ' competition-board__scene--compact' : ''}`} aria-label={edition.isFinal ? 'Podio e scena finale della classifica' : 'Podio provvisorio della classifica'}>
      <div className="competition-board__scene-head">
        <div>
          <strong>{edition.isFinal ? 'Il podio finale' : 'Il podio provvisorio'}</strong>
        </div>
      </div>
      <div className="competition-board__stage">
        <span className="competition-board__stage-light competition-board__stage-light--left" aria-hidden="true" />
        <span className="competition-board__stage-light competition-board__stage-light--right" aria-hidden="true" />
        <div className="competition-board__podium">
          {slots.map(({ rank, places }, index) => (
            <article className={`competition-board__podium-slot competition-board__podium-slot--${rank}${places.length ? '' : ' is-empty'}`} key={rank} style={{ '--podium-delay': `${index * 90}ms` } as CSSProperties}>
              {places.length ? (
                <>
                  <span className="competition-board__podium-rank" aria-label={`${rank}° posto`}>{rank}°</span>
                  <div className="competition-board__podium-actors">
                    {places.map((entry) => <CharacterActor key={entry.teamId} slot={entry.slot} action={edition.isFinal && rank === 1 ? 'winner' : 'mapIdle'} compact imageSizes="100px" className="competition-board__podium-actor" />)}
                  </div>
                  <div className="competition-board__podium-block">
                    {edition.isFinal && rank === 1 ? <img className="competition-board__prize" src="/assets/festival/coppa.webp" alt="" aria-hidden="true" /> : null}
                    {places.length === 1 ? <TeamBadgeIcon slot={places[0].slot} className="competition-board__podium-badge" /> : null}
                    <div className="competition-board__podium-places">
                      {places.map((entry) => <div key={entry.teamId}><span>{entry.teamName}</span><strong>{entry.pizzeria.name}</strong></div>)}
                    </div>
                    <b>{places[0].totalScore} <small>punti</small></b>
                  </div>
                </>
              ) : (
                <div className="competition-board__podium-block competition-board__podium-block--empty">
                  <GameIcon item={rank === 1 ? 'coppa' : 'medaglia'} size={36} />
                  <span>{rank}° posto</span>
                  <strong>{edition.isFinal ? '—' : 'Da assegnare'}</strong>
                </div>
              )}
            </article>
          ))}
        </div>
        {offPodium.length > 0 ? (
          <div className="competition-board__chorus" aria-label="Altre coppie in gara">
            {offPodium.map((entry) => <CharacterActor key={entry.teamId} slot={entry.slot} action="mapIdle" compact imageSizes="70px" className="competition-board__chorus-actor" label={`Coppia ${entry.teamName}`} />)}
          </div>
        ) : null}
        {!edition.isFinal && waiting.length ? (
          <div className="competition-board__waiting" aria-label="Squadre in attesa di classifica">
            <span>IN ATTESA DEL PRIMO VERDETTO</span>
            <div>{waiting.map((entry) => <span key={entry.teamId}><TeamBadgeIcon slot={entry.slot} />{entry.pizzeria.name}</span>)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CompetitionBoard({ entries, edition, compact = false }: Props) {
  const leaders = entries.filter((entry) => entry.rank === 1);
  const leading = leaders[0];
  return (
    <section className={`competition-board${edition.isFinal ? ' is-final' : ''}${compact ? ' competition-board--compact' : ''}`} aria-labelledby={compact ? 'home-competition-title' : 'competition-board-title'}>
      <header className="competition-board__heading">
        <div>
          <p className="section-kicker">{edition.isFinal ? 'LA CLASSIFICA FINALE' : 'LA CLASSIFICA PROVVISORIA'}</p>
          <h2 id={compact ? 'home-competition-title' : 'competition-board-title'}>{edition.isFinal ? 'Il gran finale.' : 'La gara prende forma.'}</h2>
          <p>{edition.isFinal ? 'Tutti i verdetti sono stati raccolti.' : 'La classifica diventa definitiva quando tutti i verdetti sono raccolti.'}</p>
        </div>
        <div className="competition-board__count"><strong>{edition.submittedVotes}</strong><span>/ {edition.requiredVotes}<br />verdetti</span></div>
      </header>
      <progress className="competition-board__progress" aria-label="Verdetti raccolti" value={Math.min(edition.submittedVotes, edition.requiredVotes)} max={edition.requiredVotes} />
      <PodiumScene entries={entries} edition={edition} compact={compact} />
      {edition.isFinal ? <FinalWinners entries={entries} compact={compact} /> : leading ? (
        <p className="competition-board__leader"><span aria-hidden="true">↗</span> {leaders.length > 1 ? 'In testa a pari merito' : 'In testa per ora'} <strong>{leaders.map((entry) => entry.pizzeria.name).join(', ')}</strong> · {leading.totalScore} punti</p>
      ) : !edition.isFinal ? <p className="competition-board__leader">La classifica si accende con i primi voti.</p> : null}

    </section>
  );
}
