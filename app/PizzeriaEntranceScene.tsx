'use client';

import { useState, type CSSProperties, type TransitionEvent } from 'react';
import { TeamBadgeIcon } from './team-badges';
import { teamForSlot } from './team-manifest';
import './PizzeriaEntranceScene.css';

type PizzeriaEntranceSceneProps = {
  teamSlot: number;
  teamName: string;
  restaurantName: string;
  address: string;
  city: string;
  dinnerDate: string;
  dinnerTime: string;
  bookingStatus: string;
  onBack: () => void;
  onEnter: () => void;
};

function bookingText(status: string) {
  if (status === 'prenotato') return 'Prenotazione confermata';
  if (status === 'da_confermare') return 'Da confermare';
  return 'Da prenotare';
}

function dinnerText(dateValue: string) {
  if (!dateValue) return 'Data da definire';
  const date = new Date(`${dateValue}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(date);
}

export function PizzeriaEntranceScene({
  teamSlot, teamName, restaurantName, address, city, dinnerDate, dinnerTime, bookingStatus, onBack, onEnter,
}: PizzeriaEntranceSceneProps) {
  const [opening, setOpening] = useState(false);
  const badge = teamForSlot(teamSlot);
  const venueStyle = { '--team-dark': badge.dark, '--team-rgb': badge.rgb } as CSSProperties;
  const hero = badge.assets.heroCouple;

  function enter() {
    if (opening) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onEnter();
      return;
    }
    setOpening(true);
  }

  function finishOpening(event: TransitionEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.propertyName === 'transform' && opening) onEnter();
  }

  return (
    <section className="content-view pizzeria-entrance" style={venueStyle}>
      <button className="back-link" onClick={onBack} type="button">← Torna alla mappa</button>
      <div className="pizzeria-entrance__layout">
        <div className={`pizzeria-entrance__frame${opening ? ' is-opening' : ''}`}>
          <div className="pizzeria-entrance__stage" role="group" aria-label={`Facciata della pizzeria ${restaurantName || 'della coppia'}`}>
            <div className="pizzeria-entrance__world" onTransitionEnd={finishOpening}>
                <img className="pizzeria-entrance__artwork" src={badge.assets.entranceScene} srcSet={`${badge.assets.entranceScene.replace('.webp', '-680.webp')} 680w, ${badge.assets.entranceScene} 1120w`} sizes="(max-width: 680px) 95vw, 60vw" alt="" width="1120" height="1120" decoding="async" />
                <img
                  className="pizzeria-entrance__host"
                  src={hero}
                  srcSet={`${hero.replace(/\.webp$/, '-600.webp')} 600w, ${hero} 1122w`}
                  sizes="(max-width: 680px) 30vw, 285px"
                  alt=""
                  decoding="async"
                />
                <TeamBadgeIcon slot={teamSlot} className="pizzeria-entrance__official-badge" />
                <div className="pizzeria-entrance__sign-copy" aria-hidden="true">
                  <span className="pizzeria-entrance__sign-eyebrow">PIZZERIA</span>
                  <strong className="pizzeria-entrance__sign-name">{restaurantName || 'La vostra pizzeria'}</strong>
                </div>
                <button className="pizzeria-entrance__door-hit-area" type="button" onClick={enter} disabled={opening} aria-label="Tocca la porta per entrare nella pizzeria">
                  <span aria-hidden="true"><i>→</i></span>
                </button>
            </div>
            <div className="pizzeria-entrance__threshold" aria-hidden="true">
              <span>ATTRAVERSA LA SOGLIA</span>
              <i>↓</i>
            </div>
            <div className="pizzeria-entrance__fade" aria-hidden="true" />
          </div>
          <div className="pizzeria-entrance__stage-footer">
            <span>Squadra {badge.name}</span>
            <span className="pizzeria-entrance__stage-footer-hint">{opening ? 'La tavola vi aspetta…' : 'Tocca la porta per entrare'}</span>
          </div>
        </div>
        <p className="pizzeria-entrance__opening-status" aria-live="polite">{opening ? 'La porta si apre. Entrata nella pizzeria in corso.' : ''}</p>

        <aside className="pizzeria-entrance__info">
          <div className="pizzeria-entrance__identity">
            <TeamBadgeIcon slot={teamSlot} className="pizzeria-entrance__identity-badge" />
            <div><p className="section-kicker">SQUADRA {badge.name.toUpperCase()}</p><strong>{teamName}</strong></div>
          </div>
          <h2>{restaurantName || 'La tappa è da scegliere.'}</h2>
          {!restaurantName ? <p className="pizzeria-entrance__intro">La coppia deve ancora scegliere il locale.</p> : null}
          <dl className="pizzeria-entrance__quick-info">
            <div><dt>Luogo</dt><dd>{address ? `${address}${city ? ` · ${city}` : ''}` : 'Ancora da inserire'}</dd></div>
            <div><dt>Cena</dt><dd>{dinnerText(dinnerDate)}{dinnerTime ? ` · ${dinnerTime}` : ''}</dd></div>
            <div><dt>Prenotazione</dt><dd data-booking={bookingStatus}>{bookingText(bookingStatus)}</dd></div>
          </dl>
          <button className="button button-primary pizzeria-entrance__enter" type="button" onClick={enter} disabled={opening}>
            {opening ? 'Entriamo…' : 'Entra in pizzeria'}
          </button>
        </aside>
      </div>
    </section>
  );
}
