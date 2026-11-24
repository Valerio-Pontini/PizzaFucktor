export type CharacterPose = 'idle' | 'cheer' | 'peek' | 'tasting' | 'hero' | 'surprise';
export type CharacterSide = 'a' | 'b';

export type TeamAction =
  | 'mapIdle'
  | 'mapSelected'
  | 'backstageIdle'
  | 'backstageSelected'
  | 'calendarScheduled'
  | 'calendarWaiting'
  | 'historyEmpty'
  | 'historyMemory'
  | 'dinnerTable'
  | 'winner'
  | 'teamHero'
  | 'judgmentSurprise';

type MapAnchor = { x: number; y: number; width: number; z: number };
type PizzeriaAnchor = MapAnchor & { height: number };

const characterAssets = (stem: string) => ({
  idle: `/assets/pizzeria-entrance/characters/v2/${stem}_idle.webp`,
  cheer: `/assets/pizzeria-entrance/characters/v2/${stem}_cheer.webp`,
  peek: `/assets/pizzeria-entrance/characters/v2/${stem}_peek.webp`,
  tasting: `/assets/pizzeria-entrance/characters/v2/${stem}_tasting.webp`,
  hero: `/assets/pizzeria-entrance/characters/v2/${stem}_hero.webp`,
  surprise: `/assets/pizzeria-entrance/characters/v2/${stem}_surprise.webp`,
  soloA: `/assets/pizzeria-entrance/characters/v2/${stem}_solo_a.webp`,
  soloB: `/assets/pizzeria-entrance/characters/v2/${stem}_solo_b.webp`,
});

export const COMPANION_SILHOUETTE_ASSET = '/assets/pizzeria-entrance/characters/v2/companion_silhouette.webp';

export const TEAM_MANIFEST = [
  {
    slot: 1,
    id: 'pomodoro',
    name: 'Pomodoro',
    badgeImage: '/assets/festival/sera/badge-pomodoro.webp',
    x: 49,
    y: 22,
    mapX: 21.5,
    mapY: 42,
    entranceId: 'pomodoro',
    voteKitId: 'pomodoro',
    accent: '#D94337',
    dark: '#902A2D',
    rgb: '217, 67, 55',
    assets: {
      character: characterAssets('pomodoro'),
      entranceScene: '/assets/festival/sera/pomodoro.webp',
      entranceCouple: '/assets/pizzeria-entrance/characters/pomodoro_couple.webp',
      heroCouple: '/assets/pizzeria-entrance/characters/v2/pomodoro_hero.webp',
    },
    positions: {
      map: {
        actor: { x: 20.2, y: 48.5, width: 8.2, z: 4 },
        pizzeria: { x: 13, y: 33, width: 11, height: 15, z: 2 },
      },
    },
    actions: {
      mapIdle: 'idle', mapSelected: 'cheer', backstageIdle: 'idle', backstageSelected: 'cheer',
      calendarScheduled: 'idle', calendarWaiting: 'peek', historyEmpty: 'peek', historyMemory: 'tasting',
      dinnerTable: 'tasting', winner: 'cheer', teamHero: 'hero', judgmentSurprise: 'surprise',
    },
  },
  {
    slot: 2,
    id: 'basilico',
    name: 'Basilico',
    badgeImage: '/assets/festival/sera/badge-basilico.webp',
    x: 77,
    y: 42,
    mapX: 50,
    mapY: 35,
    entranceId: 'basilico',
    voteKitId: 'basilico',
    accent: '#408348',
    dark: '#19543C',
    rgb: '64, 131, 72',
    assets: {
      character: characterAssets('basilico'),
      entranceScene: '/assets/festival/sera/basilico.webp',
      entranceCouple: '/assets/pizzeria-entrance/characters/basilico_couple.webp',
      heroCouple: '/assets/pizzeria-entrance/characters/v2/basilico_hero.webp',
    },
    positions: {
      map: {
        actor: { x: 54.8, y: 39, width: 8.4, z: 4 },
        pizzeria: { x: 46, y: 24, width: 10, height: 14, z: 2 },
      },
    },
    actions: {
      mapIdle: 'idle', mapSelected: 'cheer', backstageIdle: 'idle', backstageSelected: 'cheer',
      calendarScheduled: 'idle', calendarWaiting: 'peek', historyEmpty: 'peek', historyMemory: 'tasting',
      dinnerTable: 'tasting', winner: 'cheer', teamHero: 'hero', judgmentSurprise: 'surprise',
    },
  },
  {
    slot: 3,
    id: 'grano',
    name: 'Grano',
    badgeImage: '/assets/festival/sera/badge-grano.webp',
    x: 67,
    y: 75,
    mapX: 78.3,
    mapY: 42,
    entranceId: 'farina',
    voteKitId: 'farina',
    accent: '#D69A32',
    dark: '#86521F',
    rgb: '214, 154, 50',
    assets: {
      character: characterAssets('farina'),
      entranceScene: '/assets/festival/sera/farina.webp',
      entranceCouple: '/assets/pizzeria-entrance/characters/farina_couple.webp',
      heroCouple: '/assets/pizzeria-entrance/characters/v2/farina_hero.webp',
    },
    positions: {
      map: {
        actor: { x: 84.2, y: 48.5, width: 8.2, z: 4 },
        pizzeria: { x: 77, y: 34, width: 12, height: 15, z: 2 },
      },
    },
    actions: {
      mapIdle: 'idle', mapSelected: 'cheer', backstageIdle: 'idle', backstageSelected: 'cheer',
      calendarScheduled: 'idle', calendarWaiting: 'peek', historyEmpty: 'peek', historyMemory: 'tasting',
      dinnerTable: 'tasting', winner: 'cheer', teamHero: 'hero', judgmentSurprise: 'surprise',
    },
  },
  {
    slot: 4,
    id: 'olive',
    name: 'Olive',
    badgeImage: '/assets/festival/sera/badge-olive.webp',
    x: 30,
    y: 74,
    mapX: 26.7,
    mapY: 68,
    entranceId: 'olive',
    voteKitId: 'olive',
    accent: '#80549D',
    dark: '#4B2C6F',
    rgb: '128, 84, 157',
    assets: {
      character: characterAssets('olive'),
      entranceScene: '/assets/festival/sera/olive.webp',
      entranceCouple: '/assets/pizzeria-entrance/characters/olive_couple.webp',
      heroCouple: '/assets/pizzeria-entrance/characters/v2/olive_hero.webp',
    },
    positions: {
      map: {
        actor: { x: 27.5, y: 94, width: 11, z: 5 },
        pizzeria: { x: 18, y: 73, width: 13, height: 15, z: 2 },
      },
    },
    actions: {
      mapIdle: 'idle', mapSelected: 'cheer', backstageIdle: 'idle', backstageSelected: 'cheer',
      calendarScheduled: 'idle', calendarWaiting: 'peek', historyEmpty: 'peek', historyMemory: 'tasting',
      dinnerTable: 'tasting', winner: 'cheer', teamHero: 'hero', judgmentSurprise: 'surprise',
    },
  },
  {
    slot: 5,
    id: 'mozzarella',
    name: 'Mozzarella',
    badgeImage: '/assets/festival/sera/badge-mozzarella.webp',
    x: 21,
    y: 42,
    mapX: 72.8,
    mapY: 68,
    entranceId: 'mozzarella',
    voteKitId: 'mozzarella',
    accent: '#2C6EC1',
    dark: '#174587',
    rgb: '44, 110, 193',
    assets: {
      character: characterAssets('mozzarella'),
      entranceScene: '/assets/festival/sera/mozzarella.webp',
      entranceCouple: '/assets/pizzeria-entrance/characters/mozzarella_couple.webp',
      heroCouple: '/assets/pizzeria-entrance/characters/v2/mozzarella_hero.webp',
    },
    positions: {
      map: {
        actor: { x: 78.6, y: 94, width: 11, z: 5 },
        pizzeria: { x: 74, y: 74, width: 12, height: 14, z: 2 },
      },
    },
    actions: {
      mapIdle: 'idle', mapSelected: 'cheer', backstageIdle: 'idle', backstageSelected: 'cheer',
      calendarScheduled: 'idle', calendarWaiting: 'peek', historyEmpty: 'peek', historyMemory: 'tasting',
      dinnerTable: 'tasting', winner: 'cheer', teamHero: 'hero', judgmentSurprise: 'surprise',
    },
  },
] as const;

export type TeamManifestEntry = typeof TEAM_MANIFEST[number];
export type TeamArtId = TeamManifestEntry['voteKitId'];

export function teamForSlot(slot: number): TeamManifestEntry {
  return TEAM_MANIFEST.find((team) => team.slot === slot) ?? TEAM_MANIFEST[0];
}

export function teamPoseForAction(slot: number, action: TeamAction): CharacterPose {
  return teamForSlot(slot).actions[action];
}

export function teamCharacterAsset(slot: number, pose: CharacterPose): string {
  return teamForSlot(slot).assets.character[pose];
}

export function teamCharacterSoloAsset(slot: number, side: CharacterSide): string {
  return teamForSlot(slot).assets.character[side === 'a' ? 'soloA' : 'soloB'];
}

export function teamVoteArtIdForSlot(slot: number): TeamArtId {
  return teamForSlot(slot).voteKitId;
}
