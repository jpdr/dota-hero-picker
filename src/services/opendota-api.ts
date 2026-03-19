import { Hero, PlayerHeroStat, PlayerMatch, HeroMatchup } from '@/types/hero';
import { getCached, setCache } from './cache';

const BASE_URL = 'https://api.opendota.com/api';

const TTL_HEROES = 1440; // 24 hours
const TTL_PLAYER = 15;   // 15 minutes
const TTL_MATCHUP = 60;  // 1 hour

async function fetchJson<T>(url: string, cacheKey: string, ttlMinutes: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const response = await fetch(`${BASE_URL}${url}`);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }

  const data: T = await response.json();
  setCache(cacheKey, data, ttlMinutes);
  return data;
}

export function fetchHeroes(): Promise<Hero[]> {
  return fetchJson<Hero[]>('/heroes', 'opendota:heroes', TTL_HEROES);
}

export function fetchPlayerHeroes(accountId: string): Promise<PlayerHeroStat[]> {
  return fetchJson<PlayerHeroStat[]>(
    `/players/${accountId}/heroes`,
    `opendota:player:${accountId}:heroes`,
    TTL_PLAYER,
  );
}

export function fetchPlayerRecentMatches(accountId: string, limit = 50): Promise<PlayerMatch[]> {
  return fetchJson<PlayerMatch[]>(
    `/players/${accountId}/matches?limit=${limit}`,
    `opendota:player:${accountId}:matches:${limit}`,
    TTL_PLAYER,
  );
}

export function fetchHeroMatchups(heroId: number): Promise<HeroMatchup[]> {
  return fetchJson<HeroMatchup[]>(
    `/heroes/${heroId}/matchups`,
    `opendota:hero:${heroId}:matchups`,
    TTL_MATCHUP,
  );
}
