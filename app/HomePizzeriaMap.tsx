import type { CSSProperties } from 'react';
import { TEAM_BADGES, TeamBadgeIcon } from './team-badges';
import { CharacterActor } from './CharacterActor';
import './HomePizzeriaMap.css';

type MapPlace = {
  teamId: string;
  teamName: string;
  slot: number;
  pizzeria: {
    name: string;
    dinnerDate: string;
    bookingStatus: string;
  } | null;
};

type HomePizzeriaMapProps = {
  places: MapPlace[];
  selectedTeamId: string;
  onSelect: (teamId: string) => void;
  theme?: 'sera' | 'giorno';
};

type MapBadge = typeof TEAM_BADGES[number];

function teamColors(badge: MapBadge) {
  return { '--team-accent': badge.accent, '--team-dark': badge.dark, '--team-rgb': badge.rgb };
}

export function HomePizzeriaMap({ places, selectedTeamId, onSelect, theme = 'sera' }: HomePizzeriaMapProps) {
  const bySlot = new Map(places.map((place) => [place.slot, place]));
  const piazzaArt = theme === 'giorno'
    ? { src: '/assets/festival/piazza-giorno-1280.jpg', srcSet: '/assets/festival/piazza-giorno-680.jpg 680w, /assets/festival/piazza-giorno-1280.jpg 1280w' }
    : { src: '/assets/festival/piazza-1280.webp', srcSet: '/assets/festival/piazza-680.webp 680w, /assets/festival/piazza-1280.webp 1280w' };

  return (
    <section className="home-pizzeria-map" aria-labelledby="home-pizzeria-map-title">
      <div className="home-pizzeria-map__heading">
        <h2 id="home-pizzeria-map-title">Cinque pizzerie.<br /><em>La vostra piazza.</em></h2>
        <p>Tocca una coppia o l’ingresso di una pizzeria per entrare nella scena.</p>
      </div>

      <div className="home-pizzeria-map__art" role="group" aria-label="Mappa delle cinque pizzerie">
        <img
          className="home-pizzeria-map__image"
          src={piazzaArt.src}
          srcSet={piazzaArt.srcSet}
          sizes="(max-width: 900px) calc(100vw - 32px), (max-width: 1400px) 65vw, 940px"
          width="1312"
          height="1199"
          alt={theme === 'giorno'
            ? 'Cinque pizzerie intorno a un tavolo, nella piazza illuminata dal sole'
            : 'Cinque pizzerie intorno a un tavolo, nella piazza al tramonto'}
          fetchPriority="high"
          decoding="async"
        />
        <div className="home-pizzeria-map__ambient" aria-hidden="true">
          <span className="home-pizzeria-map__smoke home-pizzeria-map__smoke--left" />
          <span className="home-pizzeria-map__smoke home-pizzeria-map__smoke--center" />
          <span className="home-pizzeria-map__smoke home-pizzeria-map__smoke--right" />
          <span className="home-pizzeria-map__glow home-pizzeria-map__glow--left" />
          <span className="home-pizzeria-map__glow home-pizzeria-map__glow--center" />
          <span className="home-pizzeria-map__glow home-pizzeria-map__glow--right" />
        </div>
        {TEAM_BADGES.map((badge) => {
          const place = bySlot.get(badge.slot);
          const selected = place?.teamId === selectedTeamId;
          const anchor = badge.positions.map.pizzeria;
          return (
            <button
              key={badge.slot}
              className="home-pizzeria-map__pizzeria-button"
              style={{ left: `${anchor.x}%`, top: `${anchor.y}%`, width: `${anchor.width}%`, height: `${anchor.height}%`, zIndex: anchor.z, ...teamColors(badge) } as CSSProperties}
              data-team={badge.id}
              type="button"
              disabled={!place}
              aria-pressed={selected}
              aria-label={place
                ? `Apri la facciata della pizzeria ${place.pizzeria?.name ?? place.teamName}, squadra ${badge.name}`
                : `${badge.name}, pizzeria ancora libera`}
              title={place ? `Apri ${place.pizzeria?.name ?? place.teamName}` : `${badge.name}: pizzeria libera`}
              onClick={() => { if (place) onSelect(place.teamId); }}
            />
          );
        })}
        {TEAM_BADGES.map((badge) => {
          const place = bySlot.get(badge.slot);
          const selected = place?.teamId === selectedTeamId;
          const anchor = badge.positions.map.actor;
          return (
            <button
              key={badge.slot}
              className="home-pizzeria-map__character-button"
              style={{ left: `${anchor.x}%`, top: `${anchor.y}%`, width: `${anchor.width}%`, zIndex: anchor.z, ...teamColors(badge) } as CSSProperties}
              data-team={badge.id}
              type="button"
              disabled={!place}
              aria-label={place
                ? `Entra nella pizzeria di ${place.pizzeria?.name ?? place.teamName}, coppia ${badge.name}`
                : `${badge.name}, posto libero in attesa di una coppia`}
              aria-pressed={selected}
              title={place ? `Apri ${place.pizzeria?.name ?? place.teamName}` : `${badge.name}: posto libero`}
              onClick={() => { if (place) onSelect(place.teamId); }}
            >
              <CharacterActor slot={badge.slot} action={selected ? 'mapSelected' : 'mapIdle'} compact imageSizes="(max-width: 680px) 56px, 110px" />
            </button>
          );
        })}
      </div>

      <ul className="home-pizzeria-map__stops" aria-label="Ingressi delle pizzerie">
        {TEAM_BADGES.map((badge) => {
          const place = bySlot.get(badge.slot);
          if (!place) return null;
          return (
            <li key={badge.slot} style={teamColors(badge) as CSSProperties}>
              <button type="button" onClick={() => onSelect(place.teamId)}>
                <TeamBadgeIcon slot={badge.slot} className="map-stop-badge" />
                <span>
                  <small>{badge.name}</small>
                  <strong>{place.pizzeria?.name || place.teamName}</strong>
                </span>
                <span className="home-pizzeria-map__stop-arrow" aria-hidden="true">↗</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
