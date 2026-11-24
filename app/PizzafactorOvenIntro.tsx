import { useEffect, useRef, useState } from 'react';
import { GameHeader, GameIcon, Gamepad, type GameItem } from './GameArt';
import './PizzafactorOvenIntro.css';

const tournament: {
  item: GameItem;
  count: string;
  label: string;
  rule: string;
}[] = [
  {
    item: 'coppia',
    count: '05',
    label: 'Coppie',
    rule: 'Crea una squadra e invita il tuo compagno con il codice invito.',
  },
  {
    item: 'locale',
    count: '05',
    label: 'Pizzerie',
    rule: 'Ogni coppia propone una pizzeria e organizza la propria tavolata.',
  },
  {
    item: 'coppa',
    count: '01',
    label: 'Verdetto finale',
    rule: 'Vota le pizzerie delle altre coppie. La somma dei voti decide la classifica.',
  },
];

export function PizzafactorOvenIntro({
  onEnter,
  onLogin,
}: {
  onEnter: () => void;
  onLogin: () => void;
}) {
  const guide = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [entering, setEntering] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  function enter() {
    if (entering) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return onEnter();
    setEntering(true);
    timer.current = setTimeout(onEnter, 260);
  }

  return (
    <main className="festival-lobby">
      <GameHeader>
        <button
          className="game-minor"
          aria-label="Come si gioca"
          type="button"
          onClick={() => guide.current?.showModal()}
        >
          <span className="game-question" aria-hidden="true">
            ?
          </span>
          <span className="guide-wide">Come si gioca</span>
          <span className="guide-compact">Regole</span>
        </button>
        <button className="game-login" type="button" onClick={onLogin}>
          Accedi
        </button>
      </GameHeader>
      <div className="festival-container">
        <section
          className={`festival-cover${entering ? ' is-entering' : ''}`}
          aria-labelledby="festival-title"
        >
          <picture className="festival-cover__art">
            <source
              media="(max-width: 650px)"
              srcSet="/assets/festival/forno-mobile.webp"
            />
            <img
              src="/assets/festival/forno.webp"
              fetchPriority="high"
              alt="Il pizzaiolo Pomodoro sforna una margherita nella piazza al tramonto"
            />
          </picture>
          <div className="festival-cover__shade" />
          <span className="festival-cover__embers" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="festival-cover__copy">
            <p className="game-tag">
              <Gamepad /> Party game
            </p>
            <h1 className="festival-title" id="festival-title">
              <span>Pizza</span>
              <strong>Fucktor!</strong>
            </h1>
            <p className="festival-cover__description">
              La sfida tra amici alla ricerca <br />
              della pizza migliore.
            </p>
            <button
              className="game-play"
              type="button"
              onClick={enter}
              disabled={entering}
            >
              <i aria-hidden="true" />
              Entra nel giro
            </button>
          </div>
        </section>
        <section
          className="festival-stats"
          aria-labelledby="festival-stats-title"
        >
          <h2 className="festival-section-title" id="festival-stats-title">
            <span aria-hidden="true" />
            La sfida in numeri
          </h2>
          <div className="festival-stats__row">
            {tournament.map(({ item, count, label }) => (
              <div
                key={item}
                className={`festival-stat festival-stat--${item}`}
              >
                <GameIcon item={item} size={70} />
                <div>
                  <strong>{count}</strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <dialog
        className="game-guide"
        ref={guide}
        aria-labelledby="game-guide-title"
        onClick={(event) => {
          if (event.target === guide.current) guide.current?.close();
        }}
      >
        <div className="game-guide__paper">
          <h2 id="game-guide-title">Come si gioca</h2>
          <ol>
            {tournament.map(({ item, label, rule }) => (
              <li key={item}>
                <GameIcon item={item} size={48} />
                <div>
                  <strong>{label}</strong>
                  <p>{rule}</p>
                </div>
              </li>
            ))}
          </ol>
          <button
            className="game-play"
            type="button"
            onClick={() => guide.current?.close()}
          >
            Ho capito
          </button>
        </div>
      </dialog>
    </main>
  );
}
