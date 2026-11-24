'use client';

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PizzafactorOvenIntro } from './PizzafactorOvenIntro';
import { PizzafactorPizzaMapIntro } from './PizzafactorPizzaMapIntro';
import { HomePizzeriaMap } from './HomePizzeriaMap';
import { PizzeriaEntranceScene } from './PizzeriaEntranceScene';
import { PizzeriaDetailView } from './PizzeriaDetailView';
import { JudgmentScene } from './JudgmentScene';
import { EditionProgressRibbon } from './EditionProgressRibbon';
import { CompetitionBoard } from './CompetitionBoard';
import { TEAM_BADGES, TeamBadgeIcon } from './team-badges';
import { BackstageScene } from './BackstageScene';
import { SceneShell } from './SceneShell';
import { CharacterActor } from './CharacterActor';
import { COMPANION_SILHOUETTE_ASSET, teamForSlot, teamVoteArtIdForSlot } from './team-manifest';
import type { TableNote } from './DinnerTableScene';
import { GameBrand, GameIcon } from './GameArt';
import { voteAvailability, type VoteAvailability } from './voting';
import './ImmersiveUX.css';
import './FestivalGame.css';
import './FestivalSurfaces.css';
import './PiazzaDayTheme.css';

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

type Team = {
  id: string;
  name: string;
  slot: number;
  inviteCode: string;
  members: { displayName: string; isYou: boolean }[];
  pizzeria: Pizzeria | null;
};

type VoteRecord = {
  pizzaScore: number;
  frittiScore: number;
  menuScore: number;
  serviceScore: number;
  ambienceScore: number;
  notes: string;
  updatedAt: string;
};

type PizzeriaPlace = {
  myNotes: TableNote[];
  teamId: string;
  teamName: string;
  slot: number;
  pizzeria: Pizzeria | null;
};

type CompetitionPizzeria = {
  teamId: string;
  teamName: string;
  slot: number;
  pizzeria: Pizzeria;
  voteCount: number;
  totalScore: number;
  rank: number | null;
  isWinner: boolean;
  myVote: VoteRecord | null;
  voteDetails?: { player: string; pizza: number; fritti: number; conto: number; servizioLocale: number; menu: number }[] | null;
};

type AppView = 'home' | 'appointments' | 'votes' | 'history' | 'vote' | 'team' | 'pizzeria' | 'restaurant' | 'restaurant-detail';
const APP_ROUTE_VIEWS: AppView[] = ['home', 'appointments', 'votes', 'history', 'team'];
const navigationItems = [
  { view: 'home', label: 'Il giro', icon: 'mappa' },
  { view: 'appointments', label: 'Tappe', icon: 'locale' },
  { view: 'votes', label: 'Voti', icon: 'medaglia' },
  { view: 'team', label: 'Squadra', icon: 'coppia' },
] as const;
type ScoreKey = 'pizzaScore' | 'frittiScore' | 'menuScore' | 'serviceScore' | 'ambienceScore';
type VoteDraft = Pick<VoteRecord, ScoreKey | 'notes'>;

type AppData = {
  user: { username: string };
  edition: {
    teams: number;
    capacity: number;
    openSlots: number;
    occupiedSlots: number[];
    pizzerias: number;
    participants: number;
    completeTeams: number;
    submittedVotes: number;
    requiredVotes: number;
    isFinal: boolean;
  };
  team: Team | null;
  places: PizzeriaPlace[];
  competition: CompetitionPizzeria[];
};

type Props = {
  user: { username: string } | null;
};

type GuestScene = 'oven' | 'welcome' | 'login' | 'register';
type HomeArrival = { slot: number; teamName: string } | null;
type VisualTheme = 'sera' | 'giorno';

const VISUAL_THEME_STORAGE_KEY = 'pizzafactor-theme';
const VISUAL_THEME_EVENT = 'pizzafactor-theme-change';
let sessionVisualTheme: VisualTheme = 'sera';

function getVisualThemeSnapshot(): VisualTheme {
  try {
    const savedTheme = window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY);
    if (savedTheme === 'sera' || savedTheme === 'giorno') sessionVisualTheme = savedTheme;
  } catch {
    // Use the in-memory preference when browser storage is unavailable.
  }
  return sessionVisualTheme;
}

function getServerVisualThemeSnapshot(): VisualTheme {
  return 'sera';
}

function subscribeVisualTheme(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== VISUAL_THEME_STORAGE_KEY && event.key !== null) return;
    sessionVisualTheme = event.newValue === 'giorno' ? 'giorno' : 'sera';
    onChange();
  };
  const handleThemeChange = () => onChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(VISUAL_THEME_EVENT, handleThemeChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(VISUAL_THEME_EVENT, handleThemeChange);
  };
}

const emptyPizzeria: Pizzeria = {
  name: '', address: '', city: '', phone: '', website: '', mapsUrl: '', menuText: '', menuUrl: '',
  dinnerDate: '', dinnerTime: '', bookingStatus: 'da_prenotare',
  bookedUnder: '', confirmationCode: '', notes: '',
};

function formatDinner(date: string, time: string) {
  if (!date) return 'Data da scegliere';
  const parsed = new Date(`${date}T12:00:00Z`);
  const day = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parsed);
  return time ? `${day} · ${time}` : day;
}

function formatAppointmentDate(date: string) {
  if (!date) return 'Data da definire';
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parsed);
}

function dateMark(date: string) {
  if (!date) return { day: '—', month: '' };
  const parsed = new Date(`${date}T12:00:00Z`);
  return {
    day: new Intl.DateTimeFormat('it-IT', { day: '2-digit', timeZone: 'UTC' }).format(parsed),
    month: new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(parsed).replace('.', '').toUpperCase(),
  };
}

function bookingLabel(status: string) {
  if (status === 'prenotato') return 'Prenotato';
  if (status === 'da_confermare') return 'Da confermare';
  return 'Da prenotare';
}

function romeToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function NextPizzeriaWheel({ entries, onOpen }: { entries: CompetitionPizzeria[]; onOpen: (teamId: string) => void }) {
  const [selected, setSelected] = useState<CompetitionPizzeria | null>(null);
  const [spinning, setSpinning] = useState(false);
  function spin() {
    if (spinning || !entries.length) return;
    setSpinning(true);
    setSelected(null);
    window.setTimeout(() => {
      setSelected(entries[Math.floor(Math.random() * entries.length)]);
      setSpinning(false);
    }, 900);
  }
  return <section className="next-stop-wheel" aria-labelledby="next-stop-title">
    <div className="next-stop-wheel__copy"><p className="section-kicker">IL PIATTO DEL GIRO</p><h3 id="next-stop-title">Chi tocca dopo?</h3><p>Una pizza, cinque spicchi: il prossimo turno si decide a tavola.</p></div>
    <div className={`next-stop-wheel__plate-stage${spinning ? ' is-spinning' : ''}`} aria-hidden="true">
      <img className="next-stop-wheel__plate" src="/assets/vote-kit/common/plate_transition.webp" alt="" />
      <img className="next-stop-wheel__pizza" src="/assets/vote-kit/renders/pizza_cinque_gusti.webp" alt="" />
      <span className="next-stop-wheel__plate-mark">✦</span>
    </div>
    <div className={`next-stop-wheel__ticket${selected ? ' is-revealed' : ''}`} aria-live="polite">
      <span className="next-stop-wheel__ticket-kicker">{selected ? 'TAVOLATA ESTRATTA' : 'LA PIZZA DECIDE'}</span>
      {selected ? <CharacterActor slot={selected.slot} action="winner" compact className="next-stop-wheel__ticket-actor" label={`Coppia ${selected.teamName}`} /> : <span className="next-stop-wheel__ticket-mark" aria-hidden="true">✦</span>}
      <strong>{selected?.pizzeria.name ?? 'La prossima tappa'}</strong>
      <small>{selected ? selected.teamName : 'Fate girare il piatto'}</small>
      <div className="next-stop-wheel__actions">
        <button className="next-stop-wheel__spin-button" type="button" onClick={spin} disabled={spinning || !entries.length}>{spinning ? 'Gira…' : selected ? 'Gira ancora →' : 'Gira il piatto →'}</button>
      {selected ? <button className="text-button" type="button" onClick={() => onOpen(selected.teamId)}>Apri la tappa →</button> : null}
      </div>
    </div>
  </section>;
}

const emptyVote: VoteDraft = { pizzaScore: 0, frittiScore: 0, menuScore: 0, serviceScore: 0, ambienceScore: 0, notes: '' };
function entryVoteAvailability(entry: CompetitionPizzeria, ownTeamId: string | null | undefined, editionFinal: boolean) {
  return voteAvailability({
    teamId: entry.teamId,
    ownTeamId,
    myVote: entry.myVote,
    editionFinal,
    dinnerDate: entry.pizzeria.dinnerDate,
    dinnerTime: entry.pizzeria.dinnerTime,
  });
}

function VoteAvailabilityNote({ availability }: { availability: VoteAvailability }) {
  if (availability.canVote || availability.reason === 'sealed' || availability.reason === 'final') return null;
  return <small className={`vote-availability-note vote-availability-note--${availability.reason}`} role={availability.reason === 'own' ? 'status' : undefined}>{availability.message}</small>;
}

function AppointmentLine({ entry, onVote, availability }: { entry: CompetitionPizzeria; onVote: (entry: CompetitionPizzeria) => void; availability: VoteAvailability }) {
  const date = dateMark(entry.pizzeria.dinnerDate);
  return (
    <article className="appointment-line">
      <div className="appointment-date-mark" aria-label={formatAppointmentDate(entry.pizzeria.dinnerDate)}>
        <strong>{date.day}</strong><span>{date.month}</span>
      </div>
      <div className="appointment-thread" aria-hidden="true"><i /></div>
      <div className="appointment-line__copy">
        <p>{entry.teamName} <span>·</span> {entry.pizzeria.dinnerTime || 'Orario da definire'}</p>
        <h3>{entry.pizzeria.name}</h3>
        <span>{entry.pizzeria.address}{entry.pizzeria.city ? `, ${entry.pizzeria.city}` : ''}</span>
      </div>
      <div className="appointment-line__aside">
        <div className="appointment-line__actions">
          <span className={`booking-mark booking-mark--${entry.pizzeria.bookingStatus}`}>{bookingLabel(entry.pizzeria.bookingStatus)}</span>
          {entry.pizzeria.mapsUrl ? <a href={entry.pizzeria.mapsUrl} target="_blank" rel="noreferrer">Mappa</a> : null}
          <button type="button" onClick={() => onVote(entry)} disabled={!availability.canVote}>{availability.label}</button>
        </div>
        <VoteAvailabilityNote availability={availability} />
      </div>
    </article>
  );
}

function AppointmentCalendarCard({ entry, onOpen, onVote, availability, past = false }: { entry: CompetitionPizzeria; onOpen: (teamId: string) => void; onVote: (entry: CompetitionPizzeria) => void; availability: VoteAvailability; past?: boolean }) {
  const scheduled = Boolean(entry.pizzeria.dinnerDate);
  const date = dateMark(entry.pizzeria.dinnerDate);
  const time = entry.pizzeria.dinnerTime;
  const dateLabel = [formatAppointmentDate(entry.pizzeria.dinnerDate), scheduled && time].filter(Boolean).join(' · ');
  const badge = TEAM_BADGES.find((team) => team.slot === entry.slot);
  const stamp = past ? 'SERATA PASSATA' : scheduled ? bookingLabel(entry.pizzeria.bookingStatus).toUpperCase() : 'DATA DA FISSARE';

  return (
    <article style={{ '--venue-image': `url("${teamForSlot(entry.slot).assets.entranceScene.replace('.webp', '-680.webp')}")` } as React.CSSProperties} className={`appointment-calendar-card${scheduled ? '' : ' is-waiting'}${past ? ' is-past' : ''}`}>
      <button className="appointment-calendar-card__face" type="button" onClick={() => onOpen(entry.teamId)} aria-label={`Apri la tappa ${entry.pizzeria.name}, ${dateLabel}, ${stamp.toLowerCase()}`}>
        <span className="appointment-calendar-card__pin" aria-hidden="true" />
        <span className={`appointment-calendar-card__stamp appointment-calendar-card__stamp--${past ? 'past' : scheduled ? entry.pizzeria.bookingStatus : 'waiting'}`}>{stamp}</span>
        <span className="appointment-calendar-card__date" aria-label={scheduled ? formatAppointmentDate(entry.pizzeria.dinnerDate) : 'Data da definire'}>
          <strong>{scheduled ? date.day : '?'}</strong>
          <span>{scheduled ? date.month : 'DATA'}</span>
        </span>
        <span className="appointment-calendar-card__actor"><CharacterActor slot={entry.slot} action={scheduled ? 'calendarScheduled' : 'calendarWaiting'} compact label={`Coppia ${entry.teamName}`} /></span>
        <span className="appointment-calendar-card__copy">
          <span className="appointment-calendar-card__team">{badge?.name ?? entry.teamName}</span>
          <strong>{entry.pizzeria.name}</strong>
          <small>{dateLabel}</small>
        </span>
        <span className="appointment-calendar-card__open" aria-hidden="true">Apri →</span>
      </button>
      <div className="appointment-calendar-card__footer">
        <span className={`booking-mark booking-mark--${entry.pizzeria.bookingStatus}`}>{bookingLabel(entry.pizzeria.bookingStatus)}</span>
        <div>
          {entry.pizzeria.mapsUrl ? <a href={entry.pizzeria.mapsUrl} target="_blank" rel="noreferrer">Mappa</a> : null}
          <button type="button" onClick={() => onVote(entry)} disabled={!availability.canVote}>{availability.label} <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <VoteAvailabilityNote availability={availability} />
    </article>
  );
}

function HistoryAlbum({ entries, teamSlot, onExplore }: { entries: CompetitionPizzeria[]; teamSlot: number; onExplore: () => void }) {
  if (!entries.length) {
    return (
      <div className="history-album history-album--empty" aria-label="Album dei ricordi ancora vuoto">
        <div className="history-album__topline"><span>ALBUM DELLE TAVOLATE</span><strong>NESSUN VERDETTO</strong></div>
        <div className="history-album__empty-page">
          <div className="history-album__empty-photo"><span>✦</span><CharacterActor slot={teamSlot} action="historyEmpty" compact label="La vostra coppia, in attesa del primo ricordo" /></div>
          <strong>Il primo ricordo aspetta voi.</strong>
          <p>Quando sigilli un verdetto, la serata entra nell’album insieme a punteggi e appunti.</p>
          <button type="button" onClick={onExplore}>Lascia il primo verdetto <span aria-hidden="true">→</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-album" aria-label={`Album dei ricordi, ${entries.length} ${entries.length === 1 ? 'pagina' : 'pagine'}`}>
      <div className="history-album__topline"><span>ALBUM DELLE TAVOLATE</span><strong>{entries.length} {entries.length === 1 ? 'VERDETTO' : 'VERDETTI'}</strong></div>
      <div className="history-album__grid">
        {entries.map((entry, index) => {
          const vote = entry.myVote!;
          const total = vote.pizzaScore + vote.frittiScore + vote.menuScore + vote.serviceScore + vote.ambienceScore;
          const artId = teamVoteArtIdForSlot(entry.slot);
          const badge = TEAM_BADGES.find((candidate) => candidate.slot === entry.slot);
          const date = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(vote.updatedAt));
          return (
            <article className={`history-memory history-memory--${artId}`} key={entry.teamId} style={{ '--memory-delay': `${index * 90}ms` } as React.CSSProperties}>
              <span className="history-memory__pin" aria-hidden="true" />
              <div className="history-memory__photo" aria-hidden="true" style={{ backgroundImage: `url("${teamForSlot(entry.slot).assets.entranceScene.replace('.webp', '-680.webp')}")` }}>
                <span className="history-memory__photo-glow" />
                <span className="history-memory__photo-team">{badge?.name ?? entry.teamName}</span>
                <CharacterActor slot={entry.slot} action="historyMemory" compact className="history-memory__actor" />
              </div>
              <div className="history-memory__caption">
                <div className="history-memory__heading">
                  <div><span>{entry.teamName}</span><time dateTime={vote.updatedAt}>{date}</time></div>
                  <h3>{entry.pizzeria.name}</h3>
                  <p>{entry.pizzeria.city || entry.pizzeria.address}</p>
                </div>
                <div className="history-memory__score" aria-label={`Punteggio totale ${total} su 60`}><strong>{total}</strong><span>/ 60</span></div>
              </div>
              <div className="history-memory__scores" aria-label="Dettaglio delle categorie">
                <span>Pizza <b>{vote.pizzaScore}/20</b></span>
                <span>Fritti <b>{vote.frittiScore}/10</b></span>
                <span>Conto <b>{vote.menuScore}/10</b></span>
                <span>Servizio e locale <b>{vote.serviceScore}/10</b></span>
                <span>Menu <b>{vote.ambienceScore}/10</b></span>
              </div>
              {vote.notes ? <blockquote className="history-memory__note">“{vote.notes}”</blockquote> : <p className="history-memory__note history-memory__note--empty">Nessun appunto, solo il sapore della serata.</p>}
              <footer><span className="history-memory__seal"><img src="/assets/festival/sera/badge-sigillo.webp" width="22" height="22" alt="" /> Sigillato</span><span>{badge?.name ?? 'Coppia'}</span></footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TeamBoardScene({
  team,
  badgeName,
  teamNameEdit,
  onTeamNameEdit,
  onRename,
  pending,
  isFinal,
  onShare,
  onOpenPizzeria,
}: {
  team: Team;
  badgeName: string;
  teamNameEdit: string;
  onTeamNameEdit: (value: string) => void;
  onRename: (event: FormEvent<HTMLFormElement>) => void;
  pending: string;
  isFinal: boolean;
  onShare: () => void;
  onOpenPizzeria: () => void;
}) {
  const paired = team.members.length > 1;
  return (
    <div className="team-board-scene" aria-label="Bacheca della squadra">
      <div className="team-board-scene__backdrop" aria-hidden="true" />
      <div className="team-board-scene__intro">
        <div className="team-board-scene__intro-mark"><TeamBadgeIcon slot={team.slot} /></div>
        <p className="section-kicker">LA VOSTRA COPPIA · {badgeName.toUpperCase()}</p>
        <h2>Il vostro<br /><em>posto a tavola.</em></h2>
        <p>Un nome, due persone e una pizzeria da portare in sfida.</p>
        <div className="team-board-scene__status"><span className={paired ? 'is-ready' : ''} /><strong>{paired ? 'COPPIA PRONTA' : 'UN POSTO È ANCORA APERTO'}</strong><small>{team.members.length}/2 componenti</small></div>
      </div>
      <div className="team-board-scene__fridge">
        <div className="team-board-scene__fridge-top"><span>FRIGO DEL GIRO</span><strong>{String(team.slot).padStart(2, '0')} / 05</strong></div>
        <div className="team-board-scene__photo" data-paired={paired}>
          <span className="team-board-scene__photo-pin" aria-hidden="true" />
          <CharacterActor slot={team.slot} action={paired ? 'teamHero' : 'calendarWaiting'} solo={paired ? undefined : 'a'} className="team-board-scene__photo-actor" label={`Foto della squadra ${team.name}`} />
          {!paired ? <img className="team-board-scene__companion-silhouette" src={COMPANION_SILHOUETTE_ASSET} alt="" aria-hidden="true" /> : null}
          <div className="team-board-scene__photo-caption"><strong>{team.name}</strong><span>{paired ? 'LA COPPIA DEL GIRO' : 'IN ATTESA DEL COMPAGNO'}</span></div>
          {!paired ? <div className="team-board-scene__photo-pending"><b>+</b><span>Spazio per il tuo compagno</span></div> : null}
        </div>
        <div className="team-board-scene__members" aria-label="Componenti della squadra">
          {team.members.map((member) => <div className={`team-board-scene__member${member.isYou ? ' is-you' : ''}`} key={member.displayName}><span>{member.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{member.displayName}</strong><small>{member.isYou ? 'Tu · al tavolo' : 'Compagno · al tavolo'}</small></div>{member.isYou ? <i>✦</i> : null}</div>)}
          {!paired ? <div className="team-board-scene__member is-pending"><span>+</span><div><strong>Il tuo compagno</strong><small>In attesa dell’invito</small></div></div> : null}
        </div>
        <div className="team-board-scene__ticket">
          <div className="team-board-scene__ticket-copy"><span>STACCA E INVITA</span><strong>{team.inviteCode}</strong><small>Codice della squadra</small></div>
          <button type="button" onClick={onShare}><span>Condividi invito</span><b>↗</b></button>
        </div>
        <form className="team-board-scene__name" onSubmit={onRename}>
          <label><span>IL NOME SUL BIGLIETTO</span><input value={teamNameEdit} onChange={(event) => onTeamNameEdit(event.target.value)} maxLength={48} minLength={2} required /></label>
          <button className="text-button" type="submit" disabled={pending !== '' || isFinal}>{isFinal ? 'Sfida conclusa' : pending === 'rename' ? 'Aggiorno…' : 'Salva il nome →'}</button>
        </form>
        <button className="team-board-scene__pizzeria" type="button" disabled={isFinal} onClick={onOpenPizzeria}>
          <GameIcon item="locale" size={42} />
          <span><small>LA VOSTRA PIZZERIA</small><strong>{team.pizzeria?.name ?? 'Ancora da scegliere'}</strong><em>{team.pizzeria ? `${team.pizzeria.address}${team.pizzeria.city ? ` · ${team.pizzeria.city}` : ''}` : 'La scelta resta aperta finché non avete deciso insieme.'}</em></span>
          <b>{team.pizzeria ? 'Modifica →' : 'Aggiungi →'}</b>
        </button>
      </div>
    </div>
  );
}

async function responseError<T = Record<string, unknown>>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Qualcosa è andato storto. Riprova.');
  return body as T;
}

function guestSceneFromHash(): GuestScene | null {
  const route = window.location.hash.slice(1);
  if (route === 'signin') return 'register';
  if (route === 'forgot') return 'login';
  // Legacy intro links now open the pizza-map scene before authentication.
  if (route === 'intro') return 'welcome';
  if (['oven', 'welcome', 'login', 'register'].includes(route)) return route as GuestScene;
  return null;
}

function appViewFromHash(): AppView | null {
  const value = window.location.hash.slice('#app/'.length);
  return window.location.hash.startsWith('#app/') && APP_ROUTE_VIEWS.includes(value as AppView)
    ? value as AppView
    : null;
}

function appRouteForView(view: AppView): AppView {
  if (view === 'vote') return 'votes';
  if (view === 'pizzeria') return 'team';
  if (view === 'restaurant' || view === 'restaurant-detail') return 'home';
  return view;
}

export default function Dashboard({ user }: Props) {
  const visualTheme = useSyncExternalStore(subscribeVisualTheme, getVisualThemeSnapshot, getServerVisualThemeSnapshot);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [pending, setPending] = useState('');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [playerName, setPlayerName] = useState(user?.username ?? '');
  const [teamName, setTeamName] = useState('');
  const [selectedTeamSlot, setSelectedTeamSlot] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [teamNameEdit, setTeamNameEdit] = useState('');
  const [pizzeria, setPizzeria] = useState<Pizzeria>(emptyPizzeria);
  const [activeView, setActiveViewState] = useState<AppView>('home');
  const focusMenuField = useRef(false);
  const [pizzeriaReturnView, setPizzeriaReturnView] = useState<AppView>('home');
  const [voteTarget, setVoteTarget] = useState('');
  const [voteDraft, setVoteDraft] = useState<VoteDraft>(emptyVote);
  const [voteReturnView, setVoteReturnView] = useState<AppView>('home');
  const [voteSceneStage, setVoteSceneStage] = useState<'editing' | 'sealing'>('editing');
  const [voteRefreshFailed, setVoteRefreshFailed] = useState(false);
  const [voteArrival, setVoteArrival] = useState(false);
  const [homeArrival, setHomeArrival] = useState<HomeArrival>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [guestScene, setGuestScene] = useState<GuestScene>('oven');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirmation, setAuthPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState('');
  const authMode = guestScene === 'register' ? 'register' : 'login';

  function toggleVisualTheme() {
    const nextTheme = visualTheme === 'sera' ? 'giorno' : 'sera';
    sessionVisualTheme = nextTheme;
    try {
      window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Keep the selected theme for the current session if storage is unavailable.
    }
    window.dispatchEvent(new Event(VISUAL_THEME_EVENT));
  }

  function setActiveView(view: AppView) {
    setActiveViewState(view);
    if (!user) return;
    const route = appRouteForView(view);
    if (appViewFromHash() === route) return;
    const url = `${window.location.pathname}${window.location.search}#app/${route}`;
    window.history.pushState({ appView: route }, '', url);
  }

  useEffect(() => {
    if (!user) return;
    const initialView = appViewFromHash();
    if (initialView) setActiveViewState(initialView);
    const syncView = () => {
      const route = appViewFromHash();
      if (route) setActiveViewState(route);
    };
    window.addEventListener('popstate', syncView);
    window.addEventListener('hashchange', syncView);
    return () => {
      window.removeEventListener('popstate', syncView);
      window.removeEventListener('hashchange', syncView);
    };
  }, [user]);

  async function reloadData(): Promise<AppData> {
    const response = await fetch('/api/me', { cache: 'no-store' });
    const payload = await responseError<AppData>(response);
    setData(payload);
    if (payload.team) {
      setTeamNameEdit(payload.team.name);
      setPizzeria(payload.team.pizzeria ?? emptyPizzeria);
    }
    return payload;
  }

  useEffect(() => {
    if (!user) return;
    let current = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((response) => responseError<AppData>(response))
      .then((payload) => {
        if (!current) return;
        setData(payload);
        if (payload.team) {
          setTeamNameEdit(payload.team.name);
          setPizzeria(payload.team.pizzeria ?? emptyPizzeria);
        }
      })
      .catch((error: Error) => {
        if (current) setNotice({ kind: 'error', text: error.message });
      })
      .finally(() => { if (current) setLoading(false); });

    const incomingInvite = new URLSearchParams(window.location.search).get('invito');
    if (incomingInvite) setInviteCode(incomingInvite.toUpperCase());
    return () => { current = false; };
  }, [user]);

  useEffect(() => {
    if (user) return;
    const initial: GuestScene = 'oven';
    const ovenUrl = `${window.location.pathname}${window.location.search}#oven`;
    if (window.location.hash !== '#oven') window.history.replaceState({ scene: 'oven' }, '', ovenUrl);
    setGuestScene(initial);
    const syncScene = () => {
      setGuestScene(guestSceneFromHash() ?? 'oven');
    };
    window.addEventListener('popstate', syncScene);
    window.addEventListener('hashchange', syncScene);
    return () => {
      window.removeEventListener('popstate', syncScene);
      window.removeEventListener('hashchange', syncScene);
    };
  }, [user]);

  useEffect(() => {
    if (!data || data.team) return;
    setSelectedTeamSlot((current) => {
      if (current !== null && !data.edition.occupiedSlots.includes(current)) return current;
      return TEAM_BADGES.find((badge) => !data.edition.occupiedSlots.includes(badge.slot))?.slot ?? null;
    });
  }, [data]);

  useEffect(() => {
    if (activeView !== 'vote' || voteSceneStage !== 'sealing') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => {
      setActiveView(voteReturnView);
      setVoteSceneStage('editing');
      setVoteArrival(voteReturnView === 'votes');
      setNotice({
        kind: 'success',
        text: voteRefreshFailed
          ? 'Il verdetto è stato salvato, ma non sono riuscito ad aggiornare i dati. Ricarica la pagina per vedere la classifica aggiornata.'
          : voteReturnView === 'votes' ? 'Il tuo verdetto è arrivato nel piatto della classifica.' : 'Il tuo verdetto è stato salvato.',
      });
    }, reducedMotion ? 240 : 4300);
    return () => window.clearTimeout(timeout);
  }, [activeView, voteSceneStage, voteReturnView, voteRefreshFailed]);

  useEffect(() => {
    if (!voteArrival) return;
    const timeout = window.setTimeout(() => setVoteArrival(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [voteArrival]);

  useEffect(() => {
    if (!homeArrival) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => setHomeArrival(null), reducedMotion ? 360 : 1900);
    return () => window.clearTimeout(timeout);
  }, [homeArrival]);

  function navigateGuest(scene: GuestScene) {
    if (scene !== guestScene) {
      setAuthPassword('');
      setAuthPasswordConfirmation('');
      setShowPassword(false);
      setShowPasswordConfirmation(false);
    }
    const url = `${window.location.pathname}${window.location.search}#${scene}`;
    window.history.pushState({ scene }, '', url);
    setGuestScene(scene);
    setAuthError('');
  }

  async function submitTeam(event: FormEvent<HTMLFormElement>, action: 'create' | 'join') {
    event.preventDefault();
    if (action === 'create' && selectedTeamSlot === null) {
      setNotice({ kind: 'error', text: 'Scegli un badge ancora disponibile per la vostra squadra.' });
      return;
    }
    if (action === 'create' && data?.edition.occupiedSlots.includes(selectedTeamSlot!)) {
      setNotice({ kind: 'error', text: 'Questo badge è appena stato assegnato. Scegline un altro.' });
      return;
    }
    setPending(action);
    setNotice(null);
    try {
      const submittedTeamName = teamName.trim();
      const payload = await responseError<{ teamId?: string }>(await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          name: teamName,
          slot: action === 'create' ? selectedTeamSlot : undefined,
          inviteCode,
          displayName: playerName,
        }),
      }));
      const refreshedData = await reloadData();
      if (refreshedData.team) {
        setSelectedPlaceId(payload.teamId ?? refreshedData.team.id);
        setHomeArrival({
          slot: refreshedData.team.slot,
          teamName: refreshedData.team.name || submittedTeamName || 'La vostra coppia',
        });
      }
      setActiveView('home');
      setNotice({ kind: 'success', text: action === 'create' ? 'La squadra è pronta. Invita il tuo compagno!' : 'Benvenuto nella squadra!' });
      if (payload.teamId) setTeamName('');
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setPending('');
    }
  }

  async function renameTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending('rename');
    setNotice(null);
    try {
      await responseError(await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamNameEdit }),
      }));
      await reloadData();
      setNotice({ kind: 'success', text: 'Nome della squadra aggiornato.' });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setPending('');
    }
  }

  async function savePizzeria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending('pizzeria');
    setNotice(null);
    try {
      await responseError(await fetch('/api/pizzeria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pizzeria),
      }));
      await reloadData();
      setActiveView(pizzeriaReturnView);
      setNotice({ kind: 'success', text: 'Pizzeria e dettagli della cena salvati.' });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setPending('');
    }
  }

  async function saveTableNote(teamId: string, id: string, body: string) {
    const { note } = await responseError<{ note: TableNote }>(await fetch('/api/table-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, id, body }),
    }));
    setData((current) => current && ({
      ...current,
      places: current.places.map((place) => place.teamId === teamId
        ? { ...place, myNotes: [note, ...place.myNotes.filter((item) => item.id !== note.id)] }
        : place),
    }));
  }

  async function shareInvite() {
    if (!data?.team) return;
    const url = `${window.location.origin}/?invito=${encodeURIComponent(data.team.inviteCode)}`;
    const shareData = { title: `Unisciti a ${data.team.name} su Pizza Fucktor`, text: `La nostra squadra ti aspetta. Codice: ${data.team.inviteCode}`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        setNotice({ kind: 'success', text: 'Link invito copiato.' });
      }
    } catch {
      setNotice({ kind: 'error', text: 'Non sono riuscito a condividere il link. Puoi inviare il codice qui sotto.' });
    }
  }

  function openVote(entry: CompetitionPizzeria) {
    const availability = entryVoteAvailability(entry, data?.team?.id, Boolean(data?.edition.isFinal));
    if (!availability.canVote) {
      setNotice({ kind: availability.reason === 'sealed' || availability.reason === 'final' ? 'success' : 'error', text: availability.message });
      return;
    }
    setVoteTarget(entry.teamId);
    setSelectedPlaceId(entry.teamId);
    setVoteReturnView(activeView);
    setVoteDraft(emptyVote);
    setVoteSceneStage('editing');
    setVoteRefreshFailed(false);
    setActiveView('vote');
    setNotice(null);
  }

  async function submitVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending === 'vote' || voteSceneStage === 'sealing') return;
    if (!voteTarget || voteDraft.pizzaScore < 1 || voteDraft.pizzaScore > 20 || [voteDraft.frittiScore, voteDraft.menuScore, voteDraft.serviceScore, voteDraft.ambienceScore].some((score) => score < 1 || score > 10)) {
      setNotice({ kind: 'error', text: 'Assegna un voto a tutte e cinque le categorie.' });
      return;
    }
    setPending('vote');
    setNotice(null);
    try {
      await responseError(await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: voteTarget, ...voteDraft }),
      }));
      try {
        await reloadData();
        setVoteRefreshFailed(false);
      } catch {
        setVoteRefreshFailed(true);
      }
      setVoteSceneStage('sealing');
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setPending('');
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    if (authMode === 'register' && authPassword !== authPasswordConfirmation) {
      setAuthError('Le due password non coincidono.');
      return;
    }
    setAuthPending(true);
    try {
      const route = authMode === 'register' ? 'register' : 'login';
      await responseError(await fetch(`/api/auth/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          passwordConfirmation: authPasswordConfirmation,
        }),
      }));
      window.location.assign(`${window.location.pathname}${window.location.search}`);
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setAuthPending(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  }

  function openPizzeria(teamId: string) {
    setSelectedPlaceId(teamId);
    setActiveView('restaurant');
    setNotice(null);
  }

  const spots = data?.edition.openSlots ?? 5;
  const occupiedSlots = data?.edition.occupiedSlots ?? [];
  const competition = data?.competition ?? [];
  const places = data?.places ?? [];
  const today = romeToday();
  const appointments = competition
    .filter((entry) => Boolean(entry.pizzeria.dinnerDate))
    .sort((left, right) => `${left.pizzeria.dinnerDate} ${left.pizzeria.dinnerTime}`.localeCompare(`${right.pizzeria.dinnerDate} ${right.pizzeria.dinnerTime}`));
  const upcomingAppointments = appointments.filter((entry) => entry.pizzeria.dinnerDate >= today);
  const pastAppointments = appointments.filter((entry) => entry.pizzeria.dinnerDate < today).reverse();
  const unscheduledPizzerias = competition.filter((entry) => !entry.pizzeria.dinnerDate);
  const rouletteEntries = competition.length > 1 ? competition : upcomingAppointments;
  const voteSpotlight = competition.find((entry) => !entry.myVote && entry.teamId !== data?.team?.id) ?? null;
  const voteSpotlightAvailability = voteSpotlight
    ? entryVoteAvailability(voteSpotlight, data?.team?.id, Boolean(data?.edition.isFinal))
    : null;
  const voteHistory = competition.filter((entry) => entry.myVote).sort((left, right) => right.myVote!.updatedAt.localeCompare(left.myVote!.updatedAt));
  const toVoteCount = competition.filter((entry) => !entry.myVote && entry.teamId !== data?.team?.id).length;
  const activeVoteEntry = competition.find((entry) => entry.teamId === voteTarget) ?? null;
  const selectedPlaceBase = places.find((place) => place.teamId === selectedPlaceId) ?? null;
  const selectedPlace = selectedPlaceBase ? {
    ...selectedPlaceBase,
    pizzeria: data?.team && data.team.id === selectedPlaceBase.teamId
      ? data.team.pizzeria ?? selectedPlaceBase.pizzeria
      : selectedPlaceBase.pizzeria,
  } : null;
  const selectedPlaceVote = competition.find((entry) => entry.teamId === selectedPlaceId) ?? null;
  const selectedPlaceVoteAvailability = selectedPlaceVote
    ? entryVoteAvailability(selectedPlaceVote, data?.team?.id, Boolean(data?.edition.isFinal))
    : null;
  const navigationView = activeView === 'restaurant' || activeView === 'restaurant-detail' ? 'home' : activeView === 'history' || activeView === 'vote' ? 'votes' : activeView === 'pizzeria' ? 'team' : activeView;
  const sceneMeta: Record<string, { chapter: string; title: string; backLabel?: string }> = {
    home: { chapter: 'LA PIAZZA DEL GIRO', title: 'Il vostro giro' },
    appointments: { chapter: 'IL CALENDARIO DEL GIRO', title: 'Le prossime tappe', backLabel: 'Torna alla piazza' },
    votes: { chapter: 'IL VERDETTO È TUO', title: 'La tavolata dei voti', backLabel: 'Torna alla piazza' },
    history: { chapter: 'IL TUO TACCUINO', title: 'Ricordi di serata', backLabel: 'Torna ai voti' },
    vote: { chapter: 'UNA FETTA ALLA VOLTA', title: 'Il tuo verdetto', backLabel: voteReturnView === 'restaurant-detail' ? 'Torna alla pizzeria' : 'Torna alla pagina precedente' },
    team: { chapter: 'LA VOSTRA COPPIA', title: 'Il quartier generale', backLabel: 'Torna alla piazza' },
    pizzeria: { chapter: 'UNA DELLE CINQUE TAPPE', title: 'La vostra proposta', backLabel: 'Torna alla squadra' },
    restaurant: { chapter: 'LA FACCIATA DELLA PIZZERIA', title: selectedPlace?.pizzeria?.name || 'La soglia', backLabel: 'Torna alla piazza' },
    'restaurant-detail': { chapter: 'DENTRO LA PIZZERIA', title: selectedPlace?.pizzeria?.name || 'La tavolata', backLabel: 'Torna alla facciata' },
  };
  const currentSceneMeta = sceneMeta[activeView] ?? sceneMeta.home;
  const sceneBackView: AppView = activeView === 'vote'
    ? voteReturnView
    : activeView === 'restaurant-detail'
      ? 'restaurant'
      : activeView === 'pizzeria'
        ? pizzeriaReturnView
        : activeView === 'history'
          ? 'votes'
          : 'home';

  if (!user && guestScene === 'welcome') {
    return (
      <PizzafactorPizzaMapIntro
        onBack={() => navigateGuest('oven')}
        onLogin={() => navigateGuest('login')}
        onRegister={() => navigateGuest('register')}
      />
    );
  }

  if (!user && guestScene === 'oven') {
    return <PizzafactorOvenIntro onEnter={() => navigateGuest('welcome')} onLogin={() => navigateGuest('login')} />;
  }

  return (
    <main className={user ? `site-shell festival-game${data?.team ? ` site-shell--play site-shell--scene-${activeView}` : ''}` : 'guest-app'} data-theme={user ? visualTheme : undefined}>
      {user ? <header className="topbar">
        <a className="brand" href="/" aria-label="Pizza Fucktor home">
          <GameBrand />
        </a>
        {data?.team ? <nav className="desktop-nav" aria-label="Navigazione principale">
          {navigationItems.map(({ view, label, icon }) => (
            <button key={view} className={navigationView === view ? 'is-current' : ''} aria-current={navigationView === view ? 'page' : undefined} type="button" onClick={() => setActiveView(view)}><GameIcon item={icon} size={27} />{label}</button>
          ))}
        </nav> : null}
        <div className="topbar-right">
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleVisualTheme}
            aria-label={`Tema attivo ${visualTheme === 'sera' ? 'Sera' : 'Giorno'}. Attiva il tema ${visualTheme === 'sera' ? 'Giorno in piazza' : 'Sera in piazza'}`}
            aria-pressed={visualTheme === 'giorno'}
            title={`Attiva il tema ${visualTheme === 'sera' ? 'Giorno in piazza' : 'Sera in piazza'}`}
          >
            <span aria-hidden="true">{visualTheme === 'sera' ? '☾' : '☀'}</span>
            {visualTheme === 'sera' ? 'Sera' : 'Giorno'}
          </button>
          <div className="account-link">
            <span className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</span>
            <span className="account-label">{user.username}</span>
            <button className="signout-label" onClick={signOut} type="button">Esci</button>
          </div>
        </div>
      </header> : null}

      {!user ? (
        <div className="guest-flow" data-scene={guestScene}>
          {guestScene === 'login' || guestScene === 'register' ? (
            <section className={`guest-screen guest-screen--auth guest-screen--${guestScene}`} aria-labelledby="auth-title">
              <header className="guest-topline">
                <div className="guest-brand" aria-label="Pizza Fucktor">
                  <GameBrand />
                </div>
                <button className="guest-back" onClick={() => navigateGuest('welcome')} type="button" aria-label="Torna alla mappa della sfida"><span aria-hidden="true">←</span> Mappa</button>
              </header>
              <div className="guest-auth-world" aria-hidden="true"><GameIcon item={authMode === 'login' ? 'pizza' : 'coppia'} size={72} /></div>
              <div className="guest-auth-panel">
                <div className="guest-auth-heading">
                  <h1 id="auth-title">{authMode === 'login' ? <>Bentornato<br /><em>al giro.</em></> : <>Entra nella<br /><em>compagnia.</em></>}</h1>
                  <p>{authMode === 'login' ? 'Accedi con il tuo username.' : 'Scegli uno username e una password.'}</p>
                </div>
                <form className="guest-auth-form" onSubmit={submitAuth}>
                  <label className="guest-field">
                    <span>Username</span>
                    <input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="Il tuo username" minLength={3} maxLength={24} pattern="[A-Za-z0-9._-]{3,24}" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
                  </label>
                  <label className="guest-field">
                    <span>Password</span>
                    <span className="guest-password-wrap">
                      <input type={showPassword ? 'text' : 'password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder={authMode === 'register' ? 'Almeno 8 caratteri' : 'La tua password'} minLength={authMode === 'register' ? 8 : 1} maxLength={128} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required />
                      <button className="guest-password-toggle" type="button" aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Nascondi' : 'Mostra'}</button>
                    </span>
                  </label>
                  {authMode === 'register' ? (
                    <label className="guest-field">
                      <span>Ripeti la password</span>
                      <span className="guest-password-wrap">
                        <input type={showPasswordConfirmation ? 'text' : 'password'} value={authPasswordConfirmation} onChange={(event) => setAuthPasswordConfirmation(event.target.value)} placeholder="Ripeti la password" minLength={8} maxLength={128} autoComplete="new-password" required />
                        <button className="guest-password-toggle" type="button" aria-label={showPasswordConfirmation ? 'Nascondi password' : 'Mostra password'} aria-pressed={showPasswordConfirmation} onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}>{showPasswordConfirmation ? 'Nascondi' : 'Mostra'}</button>
                      </span>
                    </label>
                  ) : null}
                  {authError ? <p className="guest-auth-error" role="alert">{authError}</p> : null}
                  <button className="guest-button guest-button--primary guest-submit" type="submit" disabled={authPending}>
                    {authPending ? 'Un momento…' : authMode === 'login' ? 'Entra nella sfida' : 'Crea account'}
                  </button>
                </form>
                <div className="guest-auth-bottom">
                  <p className="guest-auth-switch">
                    {authMode === 'login' ? 'È la tua prima volta?' : 'Hai già un account?'}{' '}
                    <button type="button" onClick={() => navigateGuest(authMode === 'login' ? 'register' : 'login')}>
                      {authMode === 'login' ? 'Registrati' : 'Accedi'}
                    </button>
                  </p>
                  <p className="guest-auth-note">Conserva la password. Il recupero automatico non è disponibile.</p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <>
          <section className={`control-heading${data?.team && activeView !== 'home' ? ' control-heading--interior' : ''}`}>
            <div>
              <p className="eyebrow"><span /> PIZZA FUCKTOR · EDIZIONE TRA AMICI</p>
              <h1>{loading ? 'La tavola si sta apparecchiando.' : data?.team ? `Ciao, ${data.team.members.find((member) => member.isYou)?.displayName ?? user.username}.` : 'Prima si fa squadra.'}</h1>
              <p>{loading ? 'Un momento e ci siamo.' : data?.team ? 'Il vostro giro, gli appuntamenti e i verdetti sono tutti qui.' : 'Forma una coppia o raggiungi il tuo compagno per entrare in gara.'}</p>
            </div>
            <div className="edition-stamp" aria-label={`${data?.edition.teams ?? 0} squadre su cinque`}>
              <strong>{data?.edition.teams ?? 0}<small>/5</small></strong><span>coppie<br />in gara</span>
            </div>
          </section>

          {notice ? <p className={`notice notice-${notice.kind}`} role="status">{notice.text}</p> : null}

          {loading ? (
            <section className="loading-card" aria-live="polite"><GameIcon item="pizza" size={44} /><p>Sto aprendo il tuo posto al tavolo…</p></section>
          ) : !data ? (
            <section className="loading-card loading-card--error" aria-live="polite"><span className="loading-flame">!</span><p>Non riesco a leggere i dati della tua squadra.</p><button className="button button-outline" type="button" onClick={() => { setLoading(true); reloadData().catch((error: Error) => setNotice({ kind: 'error', text: error.message })).finally(() => setLoading(false)); }}>Riprova</button></section>
          ) : !data.team ? (
            <section className="team-setup team-setup--backstage">
              <div className="setup-intro">
                <BackstageScene
                  selectedSlot={selectedTeamSlot}
                  occupiedSlots={occupiedSlots}
                  onSelect={setSelectedTeamSlot}
                  playerName={playerName}
                  teamName={teamName}
                  theme={visualTheme}
                />
                <div className="setup-heading">
                  <h2>La tua <em>coppia.</em></h2>
                  <p>Ogni squadra ha un solo invito per il suo secondo membro.</p>
                  {spots === 0 ? <p className="capacity-note">Le cinque squadre sono complete. Puoi ancora entrare in una squadra che ti ha invitato.</p> : null}
                  <label className="field player-field"><span>Il nome che vedrà la squadra</span><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Es. Giulia" maxLength={60} autoComplete="name" required /></label>
                </div>
              </div>
              <div className="setup-forms">
                <div className="choice-grid">
                  <form className="form-card create-card" onSubmit={(event) => submitTeam(event, 'create')}>
                    <h3>Apri una squadra</h3><p>Scegliete il badge ufficiale e il nome della coppia. Il codice invito si crea subito.</p>
                    <fieldset className="team-badge-picker" disabled={spots === 0}>
                      <legend>Badge ufficiale</legend>
                      <div className="team-badge-options">
                        {TEAM_BADGES.map((badge) => {
                          const taken = occupiedSlots.includes(badge.slot);
                          const selected = selectedTeamSlot === badge.slot;
                          return (
                            <label key={badge.id} className={`team-badge-option${selected ? ' is-selected' : ''}${taken ? ' is-taken' : ''}`}>
                              <input type="radio" name="teamBadge" value={badge.slot} checked={selected} disabled={taken} onChange={() => setSelectedTeamSlot(badge.slot)} />
                              <TeamBadgeIcon slot={badge.slot} className="team-badge-option__image" />
                              <span>{badge.name}</span>
                              <small>{taken ? 'Assegnata' : selected ? 'Scelta' : 'Disponibile'}</small>
                            </label>
                          );
                        })}
                      </div>
                      <p>Ogni badge identifica una sola squadra per tutta la sfida.</p>
                    </fieldset>
                    <label className="field"><span>Nome della coppia</span><input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Es. Gli Spicchi" maxLength={48} minLength={2} required disabled={spots === 0} /></label>
                    <button className="button button-primary" type="submit" disabled={pending !== '' || spots === 0 || selectedTeamSlot === null || occupiedSlots.includes(selectedTeamSlot) || playerName.trim().length < 2}>{pending === 'create' ? 'Creo la squadra…' : 'Crea la squadra'}</button>
                  </form>
                  <form className="form-card join-card" onSubmit={(event) => submitTeam(event, 'join')}>
                    <h3>Raggiungi il tuo compagno</h3><p>Inserisci il codice invito o apri il link che ti ha mandato.</p>
                    <label className="field"><span>Codice invito</span><input className="invite-input" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="ES. 4SP1CC1" maxLength={12} required /></label>
                    <button className="button button-outline" type="submit" disabled={pending !== '' || playerName.trim().length < 2}>{pending === 'join' ? 'Ti sto aggiungendo…' : 'Unisciti alla squadra'}</button>
                  </form>
                </div>
                <p className="privacy-note">Ogni persona può appartenere a una sola coppia. Le squadre sono al massimo cinque.</p>
              </div>
            </section>
          ) : (
            <SceneShell
              scene={activeView}
              chapter={currentSceneMeta.chapter}
              title={currentSceneMeta.title}
              progress={`${data.edition.teams}/5`}
              arrival={homeArrival ? 'team-launch' : voteArrival ? 'verdict' : undefined}
              arrivalSlot={homeArrival?.slot}
              arrivalTeamName={homeArrival?.teamName}
              onBack={activeView === 'home' ? undefined : () => setActiveView(sceneBackView)}
              backLabel={currentSceneMeta.backLabel}
            >
            <div className={`control-room control-room--scene-${activeView}${activeView === 'home' ? ' control-room--home' : ''}`}>
              <div className="control-main">
                {activeView === 'home' ? (
                  <div className="dashboard-home">
                    <HomePizzeriaMap places={places} selectedTeamId={selectedPlaceId} onSelect={openPizzeria} theme={visualTheme} />
                    <EditionProgressRibbon edition={data.edition} />
                    {data.edition.isFinal ? <CompetitionBoard entries={competition} edition={data.edition} compact /> : null}

                    <div className="home-rhythm">
                      <section className="agenda-section">
                        <div className="section-heading section-heading--line"><div><p className="section-kicker">IL CALENDARIO DEL GIRO</p><h2>Prossime tavolate <span>{upcomingAppointments.length}</span></h2></div><button type="button" className="inline-arrow" onClick={() => setActiveView('appointments')}>Vedi tutto <b>→</b></button></div>
                        {upcomingAppointments.length ? <div className="appointment-rail">{upcomingAppointments.slice(0, 3).map((entry) => <AppointmentLine key={entry.teamId} entry={entry} onVote={openVote} availability={entryVoteAvailability(entry, data.team?.id, data.edition.isFinal)} />)}</div> : <div className="empty-rhythm"><GameIcon item="locale" size={36} /><p>Le date si aggiungeranno man mano che le squadre organizzano la cena.</p><button type="button" onClick={() => setActiveView('appointments')}>Guarda tutte le proposte <span>→</span></button></div>}
                        {unscheduledPizzerias.length ? <p className="quiet-count">{unscheduledPizzerias.length} {unscheduledPizzerias.length === 1 ? 'pizzeria in attesa della data' : 'pizzerie in attesa della data'}</p> : null}
                      </section>

                      <section className="turn-section">
                        <div className="turn-heading"><p className="section-kicker">IL TUO TURNO</p><h2>{toVoteCount ? 'Assaggia. Poi giudica.' : 'I tuoi verdetti'}</h2><p>{toVoteCount ? `${toVoteCount} ${toVoteCount === 1 ? 'pizzeria aspetta' : 'pizzerie aspettano'} il tuo voto personale.` : 'Hai già lasciato il tuo segno. Puoi rivedere ogni voto quando vuoi.'}</p></div>
                        {voteSpotlight ? <article className="vote-spotlight">
                          <GameIcon item="pizza" size={48} /><div className="vote-spotlight-copy"><span>{voteSpotlight.teamName}</span><h3>{voteSpotlight.pizzeria.name}</h3><p>{voteSpotlight.pizzeria.city || voteSpotlight.pizzeria.address}</p></div>
                          <button type="button" aria-label={`Vota ${voteSpotlight.pizzeria.name}`} onClick={() => openVote(voteSpotlight)} disabled={!voteSpotlightAvailability?.canVote}>{voteSpotlightAvailability?.label} <b>→</b></button>
                        </article> : <div className="all-voted"><GameIcon item="medaglia" size={31} /><p>Hai votato tutte le pizzerie già inserite.</p></div>}
                        {voteSpotlightAvailability ? <VoteAvailabilityNote availability={voteSpotlightAvailability} /> : null}
                        <button className="history-link" type="button" onClick={() => setActiveView('history')}>Apri lo storico dei voti <span>→</span></button>
                      </section>
                    </div>

                    <section className="home-team-strip">
                      <div className="team-monogram"><TeamBadgeIcon slot={data.team!.slot} className="team-badge-icon" /></div><div><span className="section-kicker">SQUADRA {TEAM_BADGES.find((badge) => badge.slot === data.team!.slot)?.name.toUpperCase()} · {String(data.team!.slot).padStart(2, '0')}</span><h2>{data.team!.name}</h2><p>{data.team!.members.map((member) => member.displayName).join(' & ')}{data.team!.members.length < 2 ? ' · in attesa del compagno' : ''}</p></div><button type="button" onClick={() => setActiveView('team')}>Gestisci squadra <span>→</span></button>
                    </section>
                  </div>
                ) : null}

                {activeView === 'restaurant' && selectedPlace ? (
                  <PizzeriaEntranceScene
                    teamSlot={selectedPlace.slot}
                    teamName={selectedPlace.teamName}
                    restaurantName={selectedPlace.pizzeria?.name ?? ''}
                    address={selectedPlace.pizzeria?.address ?? ''}
                    city={selectedPlace.pizzeria?.city ?? ''}
                    dinnerDate={selectedPlace.pizzeria?.dinnerDate ?? ''}
                    dinnerTime={selectedPlace.pizzeria?.dinnerTime ?? ''}
                    bookingStatus={selectedPlace.pizzeria?.bookingStatus ?? 'da_prenotare'}
                    onBack={() => setActiveView('home')}
                    onEnter={() => setActiveView('restaurant-detail')}
                  />
                ) : null}

                {activeView === 'restaurant-detail' && selectedPlace ? (
                  <PizzeriaDetailView
                    key={selectedPlace.teamId}
                    notes={selectedPlace.myNotes}
                    editionFinal={data.edition.isFinal}
                    onSaveNote={(id, body) => saveTableNote(selectedPlace.teamId, id, body)}
                    teamSlot={selectedPlace.slot}
                    teamName={selectedPlace.teamName}
                    pizzeria={selectedPlace.pizzeria}
                    vote={selectedPlaceVote}
                    voteAvailability={selectedPlaceVoteAvailability}
                    isOwnTeam={selectedPlace.teamId === data.team.id}
                    onBack={() => setActiveView('restaurant')}
                    onEdit={(section) => {
                      focusMenuField.current = section === 'menu' && Boolean(selectedPlace.pizzeria);
                      setPizzeriaReturnView('restaurant-detail');
                      setPizzeria(selectedPlace.pizzeria ?? emptyPizzeria);
                      setActiveView('pizzeria');
                    }}
                    onVote={() => { if (selectedPlaceVote) openVote(selectedPlaceVote); }}
                  />
                ) : null}

                {activeView === 'appointments' ? (
                  <section className="content-view appointments-view">
                    <div className="appointments-scene-heading"><div className="view-heading"><p className="section-kicker">DOVE CI SI VEDE</p><h2>Il calendario<br /><em>della sfida.</em></h2><p>Ogni tessera è una tavolata da scoprire. Aprila per entrare nella pizzeria, oppure lascia il tuo verdetto quando la serata è finita.</p></div><div className="appointments-scene-count" aria-label={`${upcomingAppointments.length} tappe fissate`}><strong>{String(upcomingAppointments.length).padStart(2, '0')}</strong><span>tappe fissate</span></div></div>
                    <div className="calendar-scene-legend" aria-label="Legenda degli stati delle tappe"><span><i className="is-booked" />Tappa fissata</span><span><i className="is-waiting" />Da organizzare</span><span><i className="is-past" />Serata passata</span></div>
                    {upcomingAppointments.length ? <div className="appointment-calendar-grid" aria-label="Prossime tappe">{upcomingAppointments.map((entry) => <AppointmentCalendarCard key={entry.teamId} entry={entry} onOpen={openPizzeria} onVote={openVote} availability={entryVoteAvailability(entry, data.team?.id, data.edition.isFinal)} />)}</div> : <div className="appointment-calendar-empty"><GameIcon item="mappa" size={38} /><p>Ancora nessuna data fissata. Le prime tessere compariranno appena la compagnia organizza la cena.</p></div>}
                    {rouletteEntries.length > 1 ? <NextPizzeriaWheel entries={rouletteEntries} onOpen={openPizzeria} /> : null}
                    {unscheduledPizzerias.length ? <section className="appointment-calendar-waiting" aria-labelledby="waiting-title"><div className="appointment-calendar-section-heading"><div><p className="section-kicker">IN ATTESA DELLA DATA</p><h3 id="waiting-title">Le tessere ancora da fissare.</h3></div><span>{unscheduledPizzerias.length} da organizzare</span></div><div className="appointment-calendar-grid appointment-calendar-grid--waiting">{unscheduledPizzerias.map((entry) => <AppointmentCalendarCard key={entry.teamId} entry={entry} onOpen={openPizzeria} onVote={openVote} availability={entryVoteAvailability(entry, data.team?.id, data.edition.isFinal)} />)}</div></section> : null}
                    {pastAppointments.length ? <details className="past-dates"><summary>Appuntamenti passati <span>{pastAppointments.length}</span></summary><div className="appointment-calendar-grid appointment-calendar-grid--past">{pastAppointments.map((entry) => <AppointmentCalendarCard key={entry.teamId} entry={entry} onOpen={openPizzeria} onVote={openVote} availability={entryVoteAvailability(entry, data.team?.id, data.edition.isFinal)} past />)}</div></details> : null}
                  </section>
                ) : null}

                {activeView === 'votes' ? (
                  <section className="content-view votes-view"><div className="view-heading"><CharacterActor slot={voteSpotlight?.slot ?? data.team!.slot} action={voteSpotlight ? 'mapIdle' : 'winner'} compact className="votes-view-actor" /><p className="section-kicker">IL VERDETTO È TUO</p><h2>{data.edition.isFinal ? <>Il gran<br /><em>finale.</em></> : <>Una fetta<br /><em>alla volta.</em></>}</h2><p>{data.edition.isFinal ? 'La compagnia ha votato tutte le tappe. Ecco la classifica definitiva.' : 'Punteggi personali, una sola volta: pizza, fritti, conto, servizio e locale, menu.'}</p><button type="button" className="text-button" onClick={() => setActiveView('history')}>Vai allo storico dei voti →</button></div>
                    {voteArrival ? <p className="votes-view__arrival" role="status"><span aria-hidden="true">✦</span> Verdetto appena sigillato · classifica aggiornata</p> : null}
                    <div className="votes-view__standings">
                      <CompetitionBoard entries={competition} edition={data.edition} />
                      {competition.length ? (
                        <section className="vote-candidates" aria-labelledby="vote-candidates-title">
                          <h3 id="vote-candidates-title">Pizzerie in gara</h3>
                          {competition.map((entry) => {
                            const ownProposal = entry.teamId === data.team?.id;
                            const availability = entryVoteAvailability(entry, data.team?.id, data.edition.isFinal);
                            return (
                              <article className={`candidate-row${entry.isWinner ? ' is-winner' : ''}${ownProposal ? ' is-own-proposal' : ''}`} key={entry.teamId}>
                                <div className="candidate-place">
                                  <span className="candidate-number" aria-label={entry.rank ? `${entry.rank}° posto` : 'Senza posizione'}>{entry.rank ? `${entry.rank}°` : '—'}</span>
                                  <TeamBadgeIcon slot={entry.slot} />
                                </div>
                                <div className="candidate-copy">
                                  <span>{entry.teamName}{ownProposal ? ' · La tua squadra' : ''}</span>
                                  <h4>{entry.pizzeria.name}</h4>
                                  <p>{entry.pizzeria.city || entry.pizzeria.address}</p>
                                </div>
                                <div className="candidate-average">
                                  <strong>{entry.voteCount ? entry.totalScore : '—'}</strong>
                                  <small>{entry.voteCount ? `punti totali · ${entry.voteCount} ${entry.voteCount === 1 ? 'voto' : 'voti'}` : 'nessun voto'}</small>
                                </div>
                                <button type="button" className={entry.myVote ? 'candidate-vote is-done' : 'candidate-vote'} onClick={() => openVote(entry)} disabled={!availability.canVote}>
                                  {availability.label}
                                  {availability.canVote ? <span aria-hidden="true">→</span> : null}
                                </button>
                                <VoteAvailabilityNote availability={availability} />
                                {entry.voteDetails ? <details className="vote-details"><summary>Vedi i voti di ogni giocatore</summary><div>{entry.voteDetails.map((vote) => <p key={vote.player}><b>{vote.player}</b><span>Pizza {vote.pizza}/20 · Fritti {vote.fritti}/10 · Conto {vote.conto}/10 · Servizio e locale {vote.servizioLocale}/10 · Menu {vote.menu}/10</span></p>)}</div></details> : null}
                              </article>
                            );
                          })}
                        </section>
                      ) : <p className="quiet-empty">Le pizzerie appariranno qui man mano che le squadre le propongono.</p>}
                    </div>
                  </section>
                ) : null}

                {activeView === 'history' ? (
                  <section className="content-view history-view"><div className="view-heading"><p className="section-kicker">IL TUO TACCUINO</p><h2>Verdetti<br /><em>personali.</em></h2><p>Rivedi i punteggi e gli appunti lasciati dopo ogni assaggio. Una volta inviati, restano sigillati.</p><button type="button" className="text-button" onClick={() => setActiveView('votes')}>← Tutte le pizzerie</button></div>
                    <HistoryAlbum entries={voteHistory} teamSlot={data.team!.slot} onExplore={() => setActiveView('votes')} />
                  </section>
                ) : null}

                {activeView === 'vote' && activeVoteEntry ? (
                  <JudgmentScene
                    teamSlot={activeVoteEntry.slot}
                teamId={teamVoteArtIdForSlot(activeVoteEntry.slot)}
                    teamName={activeVoteEntry.teamName}
                    restaurantName={activeVoteEntry.pizzeria.name}
                    location={activeVoteEntry.pizzeria.city || activeVoteEntry.pizzeria.address}
                    vote={voteDraft}
                    pending={pending === 'vote'}
                    sealing={voteSceneStage === 'sealing'}
                    backLabel={voteReturnView === 'restaurant-detail' ? 'Torna alla pizzeria' : 'Torna alla pagina precedente'}
                    onBack={() => setActiveView(voteReturnView)}
                    onChange={setVoteDraft}
                    onSubmit={submitVote}
                  />
                ) : null}

                {activeView === 'team' ? (
                  <section className="content-view team-view">
                    <TeamBoardScene
                      team={data.team!}
                      badgeName={TEAM_BADGES.find((badge) => badge.slot === data.team!.slot)?.name ?? ''}
                      teamNameEdit={teamNameEdit}
                      onTeamNameEdit={setTeamNameEdit}
                      onRename={renameTeam}
                      pending={pending}
                      isFinal={data.edition.isFinal}
                      onShare={shareInvite}
                      onOpenPizzeria={() => {
                        setPizzeriaReturnView('team');
                        setPizzeria(data.team?.pizzeria ?? emptyPizzeria);
                        setActiveView('pizzeria');
                      }}
                    />
                  </section>
                ) : null}

                {activeView === 'pizzeria' ? (
                  <section className="content-view pizzeria-edit-view"><button type="button" className="back-link" onClick={() => setActiveView(pizzeriaReturnView)}>← Torna indietro</button><div className="view-heading"><div className="pizzeria-edit-view__art" aria-hidden="true" style={{ backgroundImage: `url("${teamForSlot(data.team!.slot).assets.entranceScene.replace('.webp', '-680.webp')}")` }}><span>{data.team!.pizzeria?.name || data.team!.name}</span></div><p className="section-kicker">UNA DELLE CINQUE TAPPE</p><h2>{data.team!.pizzeria ? <>La vostra<br /><em>proposta.</em></> : <>Scegliete<br /><em>la pizzeria.</em></>}</h2><p>Salvate locale e indirizzo ora. Data, orario e prenotazione possono arrivare anche più avanti.</p></div><form className="pizzeria-form" onSubmit={savePizzeria}><div className="form-section-label"><span>IL LOCALE</span><i /></div><div className="field-grid"><label className="field field-wide"><span>Nome della pizzeria <b>*</b></span><input value={pizzeria.name} onChange={(event) => setPizzeria({ ...pizzeria, name: event.target.value })} placeholder="Es. Da Michele" maxLength={100} required /></label><label className="field field-wide"><span>Indirizzo <b>*</b></span><input value={pizzeria.address} onChange={(event) => setPizzeria({ ...pizzeria, address: event.target.value })} placeholder="Via, numero civico" maxLength={180} autoComplete="street-address" required /></label><label className="field"><span>Città</span><input value={pizzeria.city} onChange={(event) => setPizzeria({ ...pizzeria, city: event.target.value })} placeholder="Es. Napoli" maxLength={80} autoComplete="address-level2" /></label><label className="field"><span>Telefono</span><input type="tel" value={pizzeria.phone} onChange={(event) => setPizzeria({ ...pizzeria, phone: event.target.value })} placeholder="081 123 4567" maxLength={40} autoComplete="tel" /></label><label className="field"><span>Link alla mappa</span><input type="url" value={pizzeria.mapsUrl} onChange={(event) => setPizzeria({ ...pizzeria, mapsUrl: event.target.value })} placeholder="https://maps.google.com/…" maxLength={500} /></label><label className="field"><span>Sito web</span><input type="url" value={pizzeria.website} onChange={(event) => setPizzeria({ ...pizzeria, website: event.target.value })} placeholder="https://…" maxLength={240} /></label></div>
                    <div className="form-section-label"><span>IL MENU DELLA SERATA</span><i /></div>
                    <div className="field-grid">
                      <label className="field field-wide"><span>Piatti e prezzi</span><textarea ref={(field) => {
                        if (field && focusMenuField.current) {
                          focusMenuField.current = false;
                          field.focus();
                        }
                      }} value={pizzeria.menuText} onChange={(event) => setPizzeria({ ...pizzeria, menuText: event.target.value })} placeholder="Es. Margherita · 8 €" maxLength={3000} rows={4} /></label>
                      <label className="field field-wide"><span>Link alla carta del locale</span><input type="url" value={pizzeria.menuUrl} onChange={(event) => setPizzeria({ ...pizzeria, menuUrl: event.target.value })} placeholder="https://…" maxLength={500} /></label>
                    </div>
                    <details className="reservation-details"><summary><span><b>+ DETTAGLI CENA E PRENOTAZIONE</b><small>Da compilare ora o quando la data è decisa</small></span><i>⌄</i></summary><div className="field-grid"><label className="field"><span>Data della cena</span><input type="date" value={pizzeria.dinnerDate} onChange={(event) => setPizzeria({ ...pizzeria, dinnerDate: event.target.value })} /></label><label className="field"><span>Orario</span><input type="time" value={pizzeria.dinnerTime} onChange={(event) => setPizzeria({ ...pizzeria, dinnerTime: event.target.value })} /></label><label className="field"><span>Stato prenotazione</span><select value={pizzeria.bookingStatus} onChange={(event) => setPizzeria({ ...pizzeria, bookingStatus: event.target.value })}><option value="da_prenotare">Da prenotare</option><option value="da_confermare">Da confermare</option><option value="prenotato">Prenotato</option></select></label><label className="field"><span>Intestata a</span><input value={pizzeria.bookedUnder ?? ''} onChange={(event) => setPizzeria({ ...pizzeria, bookedUnder: event.target.value })} placeholder="Nome usato per prenotare" maxLength={80} /></label><label className="field field-wide"><span>Riferimento prenotazione</span><input value={pizzeria.confirmationCode ?? ''} onChange={(event) => setPizzeria({ ...pizzeria, confirmationCode: event.target.value })} placeholder="Codice o numero di conferma" maxLength={80} /></label><label className="field field-wide"><span>Note per la squadra</span><textarea value={pizzeria.notes ?? ''} onChange={(event) => setPizzeria({ ...pizzeria, notes: event.target.value })} placeholder="Es. tavolo all’aperto, esigenze alimentari…" maxLength={800} rows={3} /></label></div></details><div className="form-footer"><span>I dati si sincronizzano per entrambi.</span><button className="button button-primary save-button" type="submit" disabled={pending !== '' || data.edition.isFinal}>{data.edition.isFinal ? 'Sfida conclusa' : pending === 'pizzeria' ? 'Salvo…' : data.team!.pizzeria ? 'Aggiorna la proposta' : 'Salva la pizzeria'}</button></div></form></section>
                ) : null}
              </div>
              <aside className="control-aside"><div className="edition-note"><span className="section-kicker">LA SFIDA</span><strong>5</strong><p>coppie, 5 pizzerie, un unico tavolo di amici.</p><div className="edition-progress" aria-label={`${data.edition.teams} squadre su 5`}><i style={{ width: `${Math.min(100, data.edition.teams / 5 * 100)}%` }} /></div><small>{data.edition.teams} di 5 squadre formate</small></div><div className="aside-team-note"><span className="section-kicker">LA VOSTRA COPPIA</span><div className="aside-team-identity"><TeamBadgeIcon slot={data.team!.slot} className="aside-team-badge" /><div><b>{data.team!.name}</b><span>{TEAM_BADGES.find((badge) => badge.slot === data.team!.slot)?.name} · {data.team!.members.length}/2 componenti</span></div></div><button type="button" onClick={() => setActiveView('team')}>Apri squadra →</button></div><div className="aside-motto">“La pizza è una cosa seria.<br /><em>La classifica, anche.</em>”</div></aside>
            </div>
            </SceneShell>
          )}
        </>
      )}
      {user && data?.team && !loading ? (
        <nav className="mobile-dock" aria-label="Navigazione principale">
          {navigationItems.map(({ view, label, icon }) => (
            <button key={view} className={navigationView === view ? 'is-current' : ''} aria-current={navigationView === view ? 'page' : undefined} type="button" onClick={() => setActiveView(view)}>
              <span aria-hidden="true"><GameIcon item={icon} size={30} /></span>
              {label}{view === 'votes' && toVoteCount ? <i>{toVoteCount}</i> : null}
            </button>
          ))}
        </nav>
      ) : null}
      {user ? <footer className="site-footer"><a className="footer-brand" href="/">Pizza Fucktor</a><span>Fate posto a tavola.</span></footer> : null}
    </main>
  );
}
