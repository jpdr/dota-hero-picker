export const HERO_IMAGE_CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes';

export function getHeroImageUrl(heroName: string): string {
  const slug = heroName.replace('npc_dota_hero_', '');
  return `${HERO_IMAGE_CDN}/${slug}.png`;
}

export function getHeroIconUrl(heroName: string): string {
  const slug = heroName.replace('npc_dota_hero_', '');
  return `${HERO_IMAGE_CDN}/icons/${slug}.png`;
}

export const MIN_GAMES_DEFAULT = 30;

export const MAX_ENEMY_HEROES = 5;
export const MAX_ALLY_HEROES = 5;
export const HERO_GRID_ICON_SIZE = 48;

export const SKELETON_COUNT = 5;

export const SCORE_WEIGHT_WIN_RATE = 0.35;
export const SCORE_WEIGHT_MATCHUP = 0.3;
export const SCORE_WEIGHT_ALLY_SYNERGY = 0.2;
export const SCORE_WEIGHT_EXPERIENCE = 0.05;
export const SCORE_WEIGHT_META = 0.1;

export const MAX_CONCURRENT_FETCHES = 5;

export const TOP_RECOMMENDATIONS_COUNT = 5;
