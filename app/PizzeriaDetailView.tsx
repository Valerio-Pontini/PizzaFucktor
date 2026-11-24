import { GameIcon } from './GameArt';
import { TEAM_BADGES, TeamBadgeIcon } from './team-badges';
import { DinnerTableScene, type TableNote } from './DinnerTableScene';
import type { VoteAvailability } from './voting';
import './PizzeriaDetailView.css';

type Pizzeria = {
  name: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  mapsUrl: string;
  menuText: string;
  menuUrl: string;
  dinnerDate: string;
  dinnerTime: string;
  bookingStatus: string;
  bookedUnder?: string;
  confirmationCode?: string;
  notes?: string;
};

type Vote = {
  pizzaScore: number;
  frittiScore: number;
  menuScore: number;
  serviceScore: number;
  ambienceScore: number;
  notes: string;
  updatedAt: string;
};

type CompetitionEntry = {
  myVote: Vote | null;
  voteCount: number;
  totalScore: number;
};

type PizzeriaDetailViewProps = {
  teamSlot: number;
  teamName: string;
  notes: TableNote[];
  onSaveNote: (id: string, body: string) => Promise<void>;
  editionFinal: boolean;
  pizzeria: Pizzeria | null;
  vote: CompetitionEntry | null;
  voteAvailability: VoteAvailability | null;
  isOwnTeam: boolean;
  onBack: () => void;
  onEdit: (section?: 'menu') => void;
  onVote: () => void;
};

function dateLabel(value: string) {
  if (!value) return 'Da definire';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(date);
}

function bookingLabel(status: string) {
  if (status === 'prenotato') return 'Prenotato';
  if (status === 'da_confermare') return 'Da confermare';
  return 'Da prenotare';
}

export function PizzeriaDetailView({ teamSlot, teamName, pizzeria, vote, voteAvailability, isOwnTeam, notes, onSaveNote, editionFinal, onBack, onEdit, onVote }: PizzeriaDetailViewProps) {
  const badge = TEAM_BADGES.find((entry) => entry.slot === teamSlot) ?? TEAM_BADGES[0];

  return (
    <section className="content-view pizzeria-detail-view" data-arrival="threshold">
      <div className="pizzeria-detail-view__threshold" aria-hidden="true">
        <span> DENTRO LA PIZZERIA </span>
      </div>
      <button className="back-link" type="button" onClick={onBack}>← Torna alla facciata</button>
      <header className="pizzeria-detail-view__heading">
        <TeamBadgeIcon slot={teamSlot} className="pizzeria-detail-view__badge" />
        <div>
          <p className="section-kicker">TAPPA {String(teamSlot).padStart(2, '0')} · {badge.name.toUpperCase()} · {teamName}</p>
          <h2>{pizzeria?.name ?? 'La pizzeria della coppia'}</h2>
          <p>{pizzeria ? `${pizzeria.address}${pizzeria.city ? ` · ${pizzeria.city}` : ''}` : 'Il locale non è ancora stato scelto.'}</p>
        </div>
        {isOwnTeam ? <button className="button button-outline pizzeria-detail-view__edit" type="button" onClick={() => onEdit()}>{pizzeria ? 'Modifica scheda' : 'Aggiungi pizzeria'}</button> : null}
      </header>

      <DinnerTableScene
        teamSlot={teamSlot}
        teamName={teamName}
        pizzeria={pizzeria}
        vote={vote?.myVote ?? null}
        totalScore={vote?.totalScore ?? 0}
        voteCount={vote?.voteCount ?? 0}
        voteAvailability={voteAvailability ?? {
          canVote: false,
          reason: 'unscheduled',
          label: 'Dopo la cena',
          message: pizzeria
            ? 'Potrai votare dopo la cena, quando saranno fissati giorno e orario.'
            : 'La scheda di voto si apre quando la coppia inserisce il locale.',
        }}
        notes={notes}
        onSaveNote={onSaveNote}
        canEditMenu={isOwnTeam && !editionFinal}
        onVote={onVote}
        onEdit={() => onEdit('menu')}
      />

      {pizzeria ? (
        <div className="pizzeria-detail-view__grid">
          <section className="pizzeria-detail-card">
            <p className="section-kicker">IL LOCALE</p>
            <h3>Luogo e contatti</h3>
            <div className="pizzeria-detail-fact"><span aria-hidden="true">⌖</span><div><small>INDIRIZZO</small><strong>{pizzeria.address}{pizzeria.city ? `, ${pizzeria.city}` : ''}</strong></div></div>
            {pizzeria.mapsUrl ? <a className="pizzeria-detail-link" href={pizzeria.mapsUrl} target="_blank" rel="noreferrer">Apri la mappa</a> : null}
            {pizzeria.phone ? <div className="pizzeria-detail-fact"><span aria-hidden="true">☎</span><div><small>TELEFONO</small><a href={`tel:${pizzeria.phone}`}>{pizzeria.phone}</a></div></div> : null}
            {pizzeria.website ? <div className="pizzeria-detail-fact"><span aria-hidden="true">↗</span><div><small>SITO WEB</small><a href={pizzeria.website} target="_blank" rel="noreferrer">{pizzeria.website}</a></div></div> : null}
          </section>

          <section className="pizzeria-detail-card pizzeria-detail-card--booking">
            <p className="section-kicker">LA CENA</p>
            <h3>Data e prenotazione</h3>
            <div className="pizzeria-booking-status"><i className={`booking-dot booking-dot--${pizzeria.bookingStatus}`} />{bookingLabel(pizzeria.bookingStatus)}</div>
            <div className="pizzeria-detail-fact"><span aria-hidden="true">◷</span><div><small>APPUNTAMENTO</small><strong>{dateLabel(pizzeria.dinnerDate)}{pizzeria.dinnerTime ? ` · ${pizzeria.dinnerTime}` : ''}</strong></div></div>
            {pizzeria.bookedUnder ? <div className="pizzeria-detail-fact"><span aria-hidden="true">♧</span><div><small>INTESTATA A</small><strong>{pizzeria.bookedUnder}</strong></div></div> : null}
            {pizzeria.confirmationCode ? <div className="pizzeria-detail-fact"><span aria-hidden="true">#</span><div><small>RIFERIMENTO</small><strong>{pizzeria.confirmationCode}</strong></div></div> : null}
            {pizzeria.notes ? <blockquote className="pizzeria-detail-note"><small>NOTE DELLA COPPIA</small><p>{pizzeria.notes}</p></blockquote> : null}
          </section>

          <section className="pizzeria-review-card">
            <div><p className="section-kicker">IL TUO TACCUINO</p><h3>Assaggia, poi racconta.</h3><p>Vota pizza, fritti, conto, servizio e locale, e menu. Aggiungi un appunto da ritrovare nello storico.</p></div>
            <div className="pizzeria-review-card__score"><strong>{vote?.voteCount ? vote.totalScore : '—'}</strong><span>{vote?.voteCount ? `punti totali · ${vote.voteCount} ${vote.voteCount === 1 ? 'voto' : 'voti'}` : 'nessun voto'}</span></div>
            {vote?.myVote?.notes ? <blockquote>“{vote.myVote.notes}”</blockquote> : null}
            {voteAvailability?.canVote ? <button className="button button-primary" type="button" onClick={onVote}>Lascia il tuo voto</button> : <p className="pizzeria-review-card__waiting">{voteAvailability?.message ?? 'La scheda di voto si apre quando la coppia inserisce il locale.'}</p>}
          </section>
        </div>
      ) : (
        <div className="pizzeria-detail-empty">
          <GameIcon item="locale" size={42} />
          <h3>La scelta della pizzeria è ancora aperta.</h3>
          <p>{isOwnTeam ? 'Aggiungete nome e indirizzo quando avete deciso. Prenotazione e data si possono completare più avanti.' : 'La coppia aggiornerà luogo e prenotazione appena avrà definito la tappa.'}</p>
          {isOwnTeam ? <button className="button button-primary" type="button" onClick={() => onEdit()}>Aggiungi la pizzeria</button> : null}
        </div>
      )}
    </section>
  );
}
