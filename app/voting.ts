export type VoteAvailabilityReason = 'available' | 'own' | 'sealed' | 'final' | 'unscheduled' | 'upcoming';

export type VoteAvailability = {
  canVote: boolean;
  reason: VoteAvailabilityReason;
  label: string;
  message: string;
};

function romeDateTime(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function dinnerHasStarted(dinnerDate: string, dinnerTime: string, now = new Date()) {
  if (!dinnerDate || !dinnerTime) return false;
  const scheduled = `${dinnerDate}T${dinnerTime.slice(0, 5)}`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduled)) return false;
  return romeDateTime(now) >= scheduled;
}

function scheduledDinnerLabel(dinnerDate: string, dinnerTime: string) {
  const date = new Date(`${dinnerDate}T12:00:00Z`);
  const readableDate = Number.isNaN(date.getTime())
    ? dinnerDate
    : new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
  return `${readableDate} alle ${dinnerTime.slice(0, 5)}`;
}

export function voteAvailability({
  teamId,
  ownTeamId,
  myVote,
  editionFinal,
  dinnerDate,
  dinnerTime,
  now = new Date(),
}: {
  teamId: string;
  ownTeamId: string | null | undefined;
  myVote: unknown;
  editionFinal: boolean;
  dinnerDate: string;
  dinnerTime: string;
  now?: Date;
}): VoteAvailability {
  if (teamId === ownTeamId) {
    return { canVote: false, reason: 'own', label: 'Non votabile', message: 'Non puoi votare la pizzeria proposta dalla tua squadra.' };
  }
  if (editionFinal) {
    return { canVote: false, reason: 'final', label: 'Sfida conclusa', message: 'La sfida è conclusa: i verdetti sono sigillati.' };
  }
  if (myVote) {
    return { canVote: false, reason: 'sealed', label: 'Voto sigillato', message: 'Hai già sigillato il tuo verdetto per questa pizzeria.' };
  }
  if (!dinnerDate || !dinnerTime) {
    return { canVote: false, reason: 'unscheduled', label: 'Dopo la cena', message: 'Potrai votare dopo la cena, quando saranno fissati giorno e orario.' };
  }
  if (!dinnerHasStarted(dinnerDate, dinnerTime, now)) {
    return {
      canVote: false,
      reason: 'upcoming',
      label: 'Dopo la cena',
      message: `Potrai votare dopo la cena del ${scheduledDinnerLabel(dinnerDate, dinnerTime)}.`,
    };
  }
  return { canVote: true, reason: 'available', label: 'Vota', message: '' };
}
