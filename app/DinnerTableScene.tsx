'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { TeamBadgeIcon } from './team-badges';
import { CharacterActor } from './CharacterActor';
import { teamForSlot } from './team-manifest';
import './DinnerTableScene.css';
import type { VoteAvailability } from './voting';

type SceneStyle = CSSProperties & { [key: `--${string}`]: string | number };

export type TableNote = { id: string; body: string; createdAt: string };

type PizzeriaInfo = {
  name: string;
  menuText: string;
  menuUrl: string;
};

type SavedVote = {
  pizzaScore: number;
  frittiScore: number;
  menuScore: number;
  serviceScore: number;
  ambienceScore: number;
  notes: string;
} | null;

type DinnerTableSceneProps = {
  teamSlot: number;
  teamName: string;
  notes: TableNote[];
  onSaveNote: (id: string, body: string) => Promise<void>;
  canEditMenu: boolean;
  pizzeria: PizzeriaInfo | null;
  vote: SavedVote;
  totalScore: number;
  voteCount: number;
  voteAvailability: VoteAvailability;
  onVote: () => void;
  onEdit: () => void;
};

export function DinnerTableScene({ teamSlot, teamName, pizzeria, vote, totalScore, voteCount, voteAvailability, notes, onSaveNote, canEditMenu, onVote, onEdit }: DinnerTableSceneProps) {
  const [panel, setPanel] = useState<'menu' | 'diary' | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const noteRequest = useRef<{ id: string; body: string } | null>(null);
  const savingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const badge = teamForSlot(teamSlot);
  const sceneArtwork = '/assets/festival/sera/tavola.webp';
  const voteLabel = voteAvailability.canVote ? 'Vota la pizza'
    : voteAvailability.reason === 'sealed' ? 'Voto sigillato'
      : voteAvailability.reason === 'own' ? 'La vostra proposta'
        : voteAvailability.reason === 'final' ? 'Sfida conclusa' : 'Voto dopo cena';

  const closePanel = useCallback(() => {
    setPanel(null);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!panel || !dialog) return;
    if (!dialog.open) dialog.showModal();
    function dismissBackdrop(event: MouseEvent) {
      if (!dialog || event.target !== dialog) return;
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) closePanel();
    }
    dialog.addEventListener('mousedown', dismissBackdrop);
    return () => dialog.removeEventListener('mousedown', dismissBackdrop);
  }, [panel, closePanel]);

  async function saveNote() {
    const body = draft.trim();
    if (!body || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setNoteMessage('');
    try {
      if (noteRequest.current?.body !== body) noteRequest.current = { id: crypto.randomUUID(), body };
      await onSaveNote(noteRequest.current.id, body);
      noteRequest.current = null;
      setDraft('');
      setNoteMessage('Appunto salvato.');
    } catch (error) {
      setNoteMessage(error instanceof Error ? error.message : 'Salvataggio non riuscito. Riprova.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function openPanel(which: 'menu' | 'diary', trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setPanel(which);
  }


  return (
    <section className="dinner-table-scene" aria-label={`Tavolo della serata, squadra ${teamName}`}>
      <div className="dinner-table-scene__heading">
        <p>Tocca il menu, la pizza o il taccuino per esplorare la tavola.</p>
      </div>

      <div className="dinner-table-scene__stage" style={{ '--team-accent': badge.dark } as SceneStyle}>
        <img className="dinner-table-scene__artwork" src={sceneArtwork} srcSet={`${sceneArtwork.replace('.webp', '-680.webp')} 680w, ${sceneArtwork} 1120w`} sizes="(max-width: 800px) 95vw, 760px" width="1120" height="1120" alt="" decoding="async" />
        <CharacterActor slot={teamSlot} action="dinnerTable" compact imageSizes="(max-width: 680px) 22vw, 168px" className="dinner-table-scene__actor" />
        <div className="dinner-table-scene__caption" aria-hidden="true">
          <strong>{pizzeria?.name || 'La nostra serata'}</strong>
        </div>
        <TeamBadgeIcon slot={teamSlot} className="dinner-table-scene__official-badge" />

        <button className="dinner-table-scene__hotspot dinner-table-scene__hotspot--menu" data-hotspot="menu" type="button" onClick={(event) => openPanel('menu', event.currentTarget)} aria-label="Apri il menu della serata">
          <span><b aria-hidden="true">⌖</b> Menu</span>
        </button>
        <button className="dinner-table-scene__hotspot dinner-table-scene__hotspot--pizza" data-hotspot="pizza" data-state={voteAvailability.canVote ? 'ready' : voteAvailability.reason} type="button" onClick={onVote} disabled={!voteAvailability.canVote} aria-label={voteAvailability.canVote ? 'Apri la scheda di voto della pizza' : voteAvailability.message}>
          <span><b aria-hidden="true">✦</b>{voteLabel}</span>
        </button>
        <button className="dinner-table-scene__hotspot dinner-table-scene__hotspot--diary" data-hotspot="diary" type="button" onClick={(event) => openPanel('diary', event.currentTarget)} aria-label="Apri i tuoi appunti sulla serata">
          <span><b aria-hidden="true">▱</b> Appunti</span>
        </button>
      </div>

      <div className="dinner-table-scene__legend" aria-label="Azioni del tavolo">
        <button type="button" onClick={(event) => openPanel('menu', event.currentTarget)}><span aria-hidden="true">⌖</span> Sfoglia il menu</button>
        <button type="button" onClick={onVote} disabled={!voteAvailability.canVote} aria-label={voteAvailability.canVote ? 'Dai il voto alla pizza' : voteAvailability.message}><span aria-hidden="true">✳</span>{voteLabel}</button>
        <button type="button" onClick={(event) => openPanel('diary', event.currentTarget)}><span aria-hidden="true">▱</span> Scrivi e rileggi gli appunti</button>
      </div>
      {!voteAvailability.canVote && voteAvailability.reason !== 'sealed' && voteAvailability.reason !== 'final' ? <p className={`dinner-table-scene__vote-notice dinner-table-scene__vote-notice--${voteAvailability.reason}`} role={voteAvailability.reason === 'own' ? 'status' : undefined}>{voteAvailability.message}</p> : null}

      {panel ? (
          <dialog
            ref={dialogRef}
            className="dinner-table-scene__dialog"
            data-panel={panel}
            style={{ '--team-accent': badge.dark } as SceneStyle}
            aria-labelledby="dinner-dialog-title"
            onCancel={(event) => { event.preventDefault(); closePanel(); }}
          >
            <button className="dinner-table-scene__back" type="button" onClick={closePanel} aria-label="Torna alla tavola">← Torna alla tavola</button>
            {panel === 'menu' ? (
              <>
                <p className="section-kicker">{pizzeria?.name || teamName}</p>
                <h3 id="dinner-dialog-title">Il menu della serata</h3>
                {pizzeria?.menuText ? <p className="dinner-table-scene__menu-text">{pizzeria.menuText}</p> : null}
                {!pizzeria?.menuText && !pizzeria?.menuUrl ? <p className="dinner-table-scene__empty">La coppia deve ancora aggiungere il menu di questa tappa.</p> : null}
                <div className="dinner-table-scene__actions">
                  {pizzeria?.menuUrl ? <a className="button button-outline" href={pizzeria.menuUrl} target="_blank" rel="noreferrer">Apri la carta del locale ↗</a> : null}
                  {canEditMenu ? <button className="button button-primary" type="button" onClick={onEdit}>{pizzeria?.menuText || pizzeria?.menuUrl ? 'Modifica menu' : 'Aggiungi menu'}</button> : null}
                </div>
              </>
            ) : (
              <>
                <p className="section-kicker">{pizzeria?.name || teamName}</p>
                <h3 id="dinner-dialog-title">I tuoi appunti</h3>
                <form className="dinner-table-scene__notebook" onSubmit={(event) => { event.preventDefault(); void saveNote(); }}>
                  <label className="field"><span>Nuovo appunto personale</span>
                    <textarea maxLength={1200} rows={3} value={draft} disabled={saving}
                      placeholder="Cosa vuoi ricordare di questa tappa?"
                      onChange={(event) => { setDraft(event.target.value); setNoteMessage(''); }} />
                  </label>
                  <button className="button button-primary" type="submit" disabled={saving || !draft.trim()}>{saving ? 'Salvo…' : 'Salva appunto'}</button>
                  <output>{noteMessage}</output>
                </form>
                {notes.length ? <ul className="dinner-table-scene__notes" aria-label="Appunti salvati">
                  {notes.map((note) => <li key={note.id}>
                    <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</time>
                    <p>{note.body}</p>
                  </li>)}
                </ul> : null}
                {vote ? (
                  <>
                    <h4>Il tuo voto sigillato</h4>
                    <div className="dinner-table-scene__scores"><span>Pizza <b>{vote.pizzaScore}/20</b></span><span>Fritti <b>{vote.frittiScore}/10</b></span><span>Conto <b>{vote.menuScore}/10</b></span><span>Servizio e locale <b>{vote.serviceScore}/10</b></span><span>Menu <b>{vote.ambienceScore}/10</b></span></div>
                    <div className="dinner-table-scene__rating"><strong>{totalScore}</strong><span>{voteCount === 1 ? 'punti totali · 1 voto' : `punti totali · ${voteCount} voti`}</span></div>
                    {vote.notes ? <blockquote>“{vote.notes}”</blockquote> : null}
                  </>
                ) : null}
                {voteAvailability.canVote && !vote ? <button className="button button-primary dinner-table-scene__vote-cta" type="button" onClick={onVote}>Lascia il tuo primo voto</button> : null}
              </>
            )}
          </dialog>
      ) : null}
    </section>
  );
}
