'use client';

import type { CSSProperties, FormEvent } from 'react';
import { CharacterActor, type CharacterPose } from './CharacterActor';
import { GameIcon } from './GameArt';
import type { TeamArtId } from './team-manifest';
import './JudgmentScene.css';

type VoteDraft = {
  pizzaScore: number;
  frittiScore: number;
  menuScore: number;
  serviceScore: number;
  ambienceScore: number;
  notes: string;
};

type VoteKey = keyof Pick<VoteDraft, 'pizzaScore' | 'frittiScore' | 'menuScore' | 'serviceScore' | 'ambienceScore'>;
type Criterion = {
  key: VoteKey;
  label: string;
  art: string;
  max: number;
};

const criteria: Criterion[] = [
  { key: 'pizzaScore', label: 'Pizza', art: 'category_pizza.webp', max: 20 },
  { key: 'frittiScore', label: 'Fritti', art: 'category_fritti.webp', max: 10 },
  { key: 'menuScore', label: 'Conto', art: 'category_conto.webp', max: 10 },
  { key: 'serviceScore', label: 'Servizio e locale', art: 'category_servizio-locale.webp', max: 10 },
  { key: 'ambienceScore', label: 'Menu', art: 'category_menu-new.webp', max: 10 },
];

type Props = {
  teamSlot: number;
  teamId: TeamArtId;
  teamName: string;
  restaurantName: string;
  location: string;
  vote: VoteDraft;
  pending: boolean;
  sealing: boolean;
  backLabel: string;
  onBack: () => void;
  onChange: (vote: VoteDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const asset = (name: string) => `/assets/vote-kit/common/${name.includes('.') ? name : `${name}.webp`}`;
const teamAsset = (teamId: TeamArtId, name: string) => `/assets/vote-kit/teams/${teamId}__${name}.webp`;

function RatingPicker({ teamId, criterion, value, disabled, onChange }: {
  teamId: TeamArtId;
  criterion: Criterion;
  value: number;
  disabled: boolean;
  onChange: (score: number) => void;
}) {
  return (
    <fieldset className={`judgment-rating${value > 0 ? ' is-complete' : ''}`} disabled={disabled}>
      <legend className="judgment-rating__legend">Valutazione {criterion.label}</legend>
      <div className="judgment-rating__layout">
        <div className="judgment-rating__label">
          <img src={asset(criterion.art)} alt="" />
          <span><strong>{criterion.label}</strong><small>da 1 a {criterion.max}</small></span>
        </div>
        <div className="judgment-rating__body">
          <div className="judgment-rating__control">
            <button type="button" className="judgment-rating__step" onClick={() => onChange(Math.max(1, (value || 1) - 1))} aria-label={`Diminuisci ${criterion.label}`}>−</button>
            <input type="range" min="1" max={criterion.max} value={value || 1} style={{ '--rating-progress': `${((value || 1) - 1) / (criterion.max - 1) * 100}%` } as CSSProperties} onChange={(event) => onChange(Number(event.target.value))} aria-label={`Valutazione ${criterion.label}`} aria-valuetext={value > 0 ? `${value} su ${criterion.max}` : 'Da valutare'} />
            <button type="button" className="judgment-rating__step" onClick={() => onChange(Math.min(criterion.max, (value || 0) + 1))} aria-label={`Aumenta ${criterion.label}`}>+</button>
          </div>
          <output aria-live="polite">{value > 0 ? value : '—'}<small>/{criterion.max}</small></output>
          <div className="judgment-rating__scale" aria-hidden="true"><span>1</span><span>{Math.ceil(criterion.max / 2)}</span><span>{criterion.max}</span></div>
        </div>
      </div>
      {value > 0 ? <img className="judgment-rating__tick" src={teamAsset(teamId, 'category_tick')} alt="" aria-hidden="true" /> : null}
    </fieldset>
  );
}

export function JudgmentScene({ teamSlot, teamId, teamName, restaurantName, location, vote, pending, sealing, backLabel, onBack, onChange, onSubmit }: Props) {
  const completed = criteria.filter((criterion) => vote[criterion.key] > 0).length;
  const remaining = criteria.length - completed;
  const locked = pending || sealing;
  const companion: { pose: CharacterPose; kicker: string; message: string } = sealing
    ? { pose: 'cheer', kicker: 'VERDETTO CONSEGNATO', message: 'La coppia ha chiuso il cerchio.' }
    : remaining === 0
      ? { pose: 'cheer', kicker: 'PRONTO DA SIGILLARE', message: 'Manca solo il gesto finale.' }
      : completed >= 3
        ? { pose: 'surprise', kicker: 'IL GIUDIZIO PRENDE FORMA', message: remaining === 1 ? 'Manca una categoria.' : `Mancano ${remaining} categorie.` }
        : { pose: 'tasting', kicker: 'ASSAGGIO IN CORSO', message: 'Partiamo dalla fetta che resta in memoria.' };

  return (
    <section className="content-view vote-edit-view judgment-scene" data-team={teamId}>
      <div className={`judgment-stage${sealing ? ' is-sealing' : ' is-entering'}`}>
        <button type="button" className="judgment-back" onClick={onBack} disabled={pending || sealing}>
          <span aria-hidden="true">←</span> {backLabel}
        </button>

        <div className="judgment-transition" aria-hidden="true">
          <img className="judgment-transition__plate" src={asset('plate_transition')} alt="" />
          <img className="judgment-transition__pizza" src="/assets/vote-kit/renders/pizza_cinque_gusti.webp" alt="" />
        </div>

        <aside className={`judgment-companion${sealing ? ' is-sealing' : ''}`} aria-live="polite">
          <div className="judgment-companion__bubble">
            <span>{companion.kicker}</span>
            <strong>{companion.message}</strong>
          </div>
          <CharacterActor
            slot={teamSlot}
            pose={companion.pose}
            className="judgment-companion__actor"
            label={`La coppia ${teamName}: ${companion.message}`}
          />
        </aside>

        <form className="judgment-form" onSubmit={onSubmit}>
          <div className="judgment-board">
            <img className="judgment-board__clip" src={asset('golden_clip')} alt="" />

            <div className="judgment-paper-content">
              <header className="judgment-heading">
                <p>{teamName} · IL TUO VERDETTO</p>
                <h1>{restaurantName}</h1>
                {location ? <span>{location}</span> : null}
              </header>

              <div className="judgment-ratings">
                {criteria.map((criterion) => (
                  <RatingPicker
                    key={criterion.key}
                    teamId={teamId}
                    criterion={criterion}
                    value={vote[criterion.key]}
                    disabled={locked}
                    onChange={(score) => onChange({ ...vote, [criterion.key]: score })}
                  />
                ))}
              </div>

              <label className="judgment-note">
                <span>Un appunto, se ti va</span>
                <textarea
                  value={vote.notes}
                  onChange={(event) => onChange({ ...vote, notes: event.target.value })}
                  rows={2}
                  maxLength={800}
                  placeholder="Il cornicione era una nuvola?"
                  disabled={locked}
                  aria-label="Un appunto facoltativo sulla pizzeria"
                />
                <small>{vote.notes.length}/800</small>
              </label>
            </div>

            <img className="judgment-stamp" src={asset('stamp_wood_handle')} alt="" aria-hidden="true" />
            <img className="judgment-impression" src={teamAsset(teamId, 'ink_stamp')} alt="" aria-hidden="true" />
            <img className="judgment-spark" src={asset('sparkle_burst')} alt="" aria-hidden="true" />
          </div>

          <div className="judgment-form-footer">
            <div className="judgment-form-progress">
              <p id="judgment-progress-label">{completed} categorie su {criteria.length} valutate</p>
              <progress aria-labelledby="judgment-progress-label" value={completed} max={criteria.length} />
            </div>
            <button className="judgment-submit" type="submit" disabled={locked || remaining > 0}>
              {pending ? 'Salvo il verdetto…' : sealing ? 'Verdetto sigillato' : 'Sigilla il verdetto'}
              {!pending && !sealing ? <GameIcon item="medaglia" size={26} /> : null}
            </button>
          </div>
        </form>

        <div className="judgment-envelope" aria-hidden="true">
          <img className="judgment-envelope__back" src={asset('envelope_back')} alt="" />
          <img className="judgment-envelope__paper" src={asset('paper_folded')} alt="" />
          <img className="judgment-envelope__pocket" src={asset('envelope_pocket')} alt="" />
          <img className="judgment-envelope__flap" src={asset('envelope_flap')} alt="" />
          <img className="judgment-envelope__ribbon" src={teamAsset(teamId, 'wax_ribbon')} alt="" />
          <img className="judgment-envelope__seal" src={teamAsset(teamId, 'wax_seal')} alt="" />
        </div>
        <div className="judgment-handoff" aria-hidden="true">
          <span className="judgment-handoff__route" />
          <span className="judgment-handoff__route-dot judgment-handoff__route-dot--one" />
          <span className="judgment-handoff__route-dot judgment-handoff__route-dot--two" />
          <span className="judgment-handoff__destination">
            <span className="judgment-handoff__destination-mark">✦</span>
            <span><strong>IL PIATTO DEI VERDETTI</strong><small>classifica aggiornata</small></span>
          </span>
          <img className="judgment-handoff__seal" src={teamAsset(teamId, 'wax_seal')} alt="" />
        </div>
        <p className="judgment-sealed-message" aria-live="polite">Verdetto sigillato!</p>
        <span className="judgment-sr-status" role="status" aria-live="polite">{sealing ? 'Voto salvato. Il verdetto viene sigillato.' : ''}</span>
      </div>
    </section>
  );
}
