import './EditionProgressRibbon.css';
import { GameIcon, type GameItem } from './GameArt';

type EditionProgressRibbonProps = {
  edition: {
    teams: number;
    capacity: number;
    pizzerias: number;
    participants: number;
    completeTeams: number;
    submittedVotes: number;
    requiredVotes: number;
    isFinal: boolean;
  };
};

export function EditionProgressRibbon({ edition }: EditionProgressRibbonProps) {
  const stages: { icon: GameItem; name: string; value: string; detail: string; complete: boolean; ratio: number }[] = [
    {
      icon: 'coppia',
      name: 'Le coppie',
      value: `${edition.completeTeams}/${edition.capacity}`,
      detail: `${edition.teams} squadre formate`,
      complete: edition.completeTeams === edition.capacity,
      ratio: edition.capacity ? edition.completeTeams / edition.capacity : 0,
    },
    {
      icon: 'locale',
      name: 'Le pizzerie',
      value: `${edition.pizzerias}/${edition.capacity}`,
      detail: 'una tappa per squadra',
      complete: edition.pizzerias === edition.capacity,
      ratio: edition.capacity ? edition.pizzerias / edition.capacity : 0,
    },
    {
      icon: 'pizza',
      name: 'La tavolata',
      value: `${edition.participants}/${edition.capacity * 2}`,
      detail: `${edition.completeTeams}/${edition.capacity} coppie complete`,
      complete: edition.participants === edition.capacity * 2,
      ratio: edition.capacity ? edition.participants / (edition.capacity * 2) : 0,
    },
    {
      icon: 'medaglia',
      name: 'I verdetti',
      value: `${edition.submittedVotes}/${edition.requiredVotes}`,
      detail: edition.isFinal ? 'classifica sigillata' : 'per eleggere la vincitrice',
      complete: edition.isFinal,
      ratio: edition.requiredVotes ? edition.submittedVotes / edition.requiredVotes : 0,
    },
  ];

  return (
    <section className={`edition-ribbon${edition.isFinal ? ' is-final' : ''}`} aria-labelledby="edition-ribbon-title">
      <div className="edition-ribbon__heading">
        <div>
          <p className="section-kicker">IL FILO DELLA SFIDA</p>
          <h2 id="edition-ribbon-title">{edition.isFinal ? 'Il giro è completo.' : 'Tutto porta alla tavolata.'}</h2>
        </div>
        <span className="edition-ribbon__seal" aria-label={edition.isFinal ? 'Sfida conclusa' : 'Sfida in corso'}>{edition.isFinal ? 'FATTO' : 'IN CORSO'}</span>
      </div>
      <ol className="edition-ribbon__stages">
        {stages.map((stage) => (
          <li key={stage.icon} className={stage.complete ? 'is-complete' : ''}>
            <div className="edition-ribbon__stage-top"><GameIcon item={stage.icon} size={32} /><strong>{stage.value}</strong></div>
            <b>{stage.name}</b>
            <small>{stage.detail}</small>
            <span className="edition-ribbon__track" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, stage.ratio * 100))}%` }} /></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
