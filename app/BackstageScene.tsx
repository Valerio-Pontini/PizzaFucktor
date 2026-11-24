import { CharacterActor } from './CharacterActor';
import { teamBadgeForSlot } from './team-badges';
import './BackstageScene.css';

type BackstageSceneProps = {
  selectedSlot: number | null;
  occupiedSlots: number[];
  onSelect: (slot: number) => void;
  playerName?: string;
  teamName?: string;
  theme?: 'sera' | 'giorno';
};

const slots = [1, 2, 3, 4, 5];

export function BackstageScene({ selectedSlot, occupiedSlots, onSelect, playerName = '', teamName = '', theme = 'sera' }: BackstageSceneProps) {
  const selectedBadge = selectedSlot ? teamBadgeForSlot(selectedSlot) : null;
  const kitchenArt = theme === 'giorno'
    ? { src: '/assets/festival/cucina-giorno-1400.jpg', srcSet: '/assets/festival/cucina-giorno-760.jpg 760w, /assets/festival/cucina-giorno-1400.jpg 1400w' }
    : { src: '/assets/festival/cucina-760.webp', srcSet: '/assets/festival/cucina-760.webp 760w, /assets/festival/cucina-1400.webp 1400w' };
  const selectionTitle = selectedBadge ? selectedBadge.name : 'Scegli il tuo personaggio';
  const selectionDetail = selectedBadge
    ? `${playerName.trim() || 'Il tuo nome'}${teamName.trim() ? ` · ${teamName.trim()}` : ''}`
    : 'Il personaggio scelto diventa il badge della squadra.';

  return (
    <div className="backstage-scene" aria-label="Backstage della cucina, scegliete il vostro personaggio">
      <img className="backstage-scene__background" src={kitchenArt.src} srcSet={kitchenArt.srcSet} sizes="(max-width: 700px) 95vw, 65vw" alt="" aria-hidden="true" />
      <div className="backstage-scene__light" aria-hidden="true" />
      <div className="backstage-scene__steam" aria-hidden="true"><i /><i /><i /></div>
      <div className="backstage-scene__selection" aria-live="polite">
        {selectedBadge ? <span>Personaggio scelto</span> : null}
        <strong>{selectionTitle}</strong>
        <small>{selectionDetail}</small>
      </div>
      <div className="backstage-scene__actors">
        {slots.map((slot) => {
          const badge = teamBadgeForSlot(slot);
          const taken = occupiedSlots.includes(slot);
          const selected = selectedSlot === slot;
          return <button
            className={`backstage-scene__actor${selected ? ' is-selected' : ''}${taken ? ' is-taken' : ''}`}
            key={slot}
            type="button"
            disabled={taken}
            aria-pressed={selected}
            aria-label={taken ? `${badge.name}, personaggio già assegnato` : `Scegli la coppia ${badge.name}`}
            onClick={() => onSelect(slot)}
          >
            <CharacterActor slot={slot} solo="a" action={selectedSlot === slot ? 'backstageSelected' : 'backstageIdle'} compact />
            <span className="backstage-scene__actor-label">
              <strong>{badge.name}</strong>
              <small>{taken ? 'Assegnato' : selected ? 'Scelto' : 'Disponibile'}</small>
            </span>
          </button>;
        })}
      </div>
    </div>
  );
}
