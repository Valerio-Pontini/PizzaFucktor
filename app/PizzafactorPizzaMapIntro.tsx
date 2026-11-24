import { GameHeader, GameIcon } from './GameArt';
import { TEAM_BADGES, TeamBadgeIcon } from './team-badges';
import './PizzafactorPizzaMapIntro.css';

type PizzaMapIntroProps = {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

export function PizzafactorPizzaMapIntro({
  onBack,
  onLogin,
  onRegister,
}: PizzaMapIntroProps) {
  return (
    <main className="festival-lobby">
      <GameHeader>
        <button className="game-minor" onClick={onBack} type="button">
          Torna al forno
        </button>
      </GameHeader>
      <section
        className="game-map-intro festival-container"
        aria-labelledby="map-intro-title"
      >
        <div className="game-map-intro__copy">
          <p className="game-tag">
            <GameIcon item="mappa" size={24} />
            La mappa della sfida
          </p>
          <h1 id="map-intro-title">
            Il giro
            <br />
            <em>comincia qui.</em>
          </h1>
          <p>
            A ogni tappa assaggiate e votate. Il verdetto si conquista insieme.
          </p>
          <ul aria-label="I simboli delle cinque squadre">
            {TEAM_BADGES.map((team) => (
              <li key={team.id}>
                <TeamBadgeIcon slot={team.slot} />
                <span>{team.name}</span>
              </li>
            ))}
          </ul>
          <div className="game-map-intro__actions">
            <button className="game-play" onClick={onLogin} type="button">
              <i aria-hidden="true" />
              Accedi
            </button>
            <button
              className="game-secondary"
              type="button"
              onClick={onRegister}
            >
              Crea un account
            </button>
          </div>
        </div>
        <img
          className="game-map-intro__map"
          src="/assets/festival/piazza-1280.webp"
          srcSet="/assets/festival/piazza-680.webp 680w, /assets/festival/piazza-1280.webp 1280w"
          sizes="(max-width: 700px) 100vw, 55vw"
          alt="Le cinque pizzerie delle squadre attorno al tavolo della piazza"
        />
      </section>
    </main>
  );
}
