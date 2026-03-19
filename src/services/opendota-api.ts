import { Hero, PlayerHeroStat, HeroMatchup, HeroDuration } from '@/types/hero';
import { LaneRoleStat } from '@/types/lane';
import { DotaItem, ItemPopularity, ExplorerResponse } from '@/types/item';
import { HeroStats } from '@/types/meta';
import { getCached, setCache } from './cache';

const BASE_URL = 'https://api.opendota.com/api';

const TTL_HEROES = 1440; // 24 hours
const TTL_PLAYER = 15;   // 15 minutes
const TTL_MATCHUP = 60;  // 1 hour
const TTL_LANE_ROLES = 1440; // 24 hours
const TTL_ITEMS = 1440; // 24 hours
const TTL_ITEM_POPULARITY = 60; // 1 hour
const TTL_EXPLORER = 60; // 1 hour
const TTL_DURATIONS = 1440; // 24 hours
const TTL_HERO_STATS = 60; // 1 hour
const TTL_ALLY_SYNERGY = 60; // 1 hour

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
  const encoded = encodeURIComponent(accountId);
  return fetchJson<PlayerHeroStat[]>(
    `/players/${encoded}/heroes`,
    `opendota:player:${encoded}:heroes`,
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

export function fetchLaneRoles(): Promise<LaneRoleStat[]> {
  return fetchJson<LaneRoleStat[]>(
    '/scenarios/laneRoles',
    'opendota:laneRoles',
    TTL_LANE_ROLES,
  );
}

export function fetchItems(): Promise<Record<string, DotaItem>> {
  return fetchJson<Record<string, DotaItem>>(
    '/constants/items',
    'opendota:items',
    TTL_ITEMS,
  );
}

export function fetchItemIds(): Promise<Record<string, string>> {
  return fetchJson<Record<string, string>>(
    '/constants/item_ids',
    'opendota:item_ids',
    TTL_ITEMS,
  );
}

export function fetchHeroItemPopularity(heroId: number): Promise<ItemPopularity> {
  return fetchJson<ItemPopularity>(
    `/heroes/${heroId}/itemPopularity`,
    `opendota:hero:${heroId}:itemPopularity`,
    TTL_ITEM_POPULARITY,
  );
}

function buildExplorerSql(heroId: number, enemyHeroIds: number[]): string {
  const enemyIds = enemyHeroIds.join(',');
  const slots = Array.from({ length: 6 }, (_, i) => {
    const col = `item_${i}`;
    return `SELECT pm.${col} as item_id, count(*) as games, sum(case when (pm.player_slot < 128) = m.radiant_win then 1 else 0 end) as wins FROM player_matches pm JOIN matches m USING(match_id) JOIN player_matches pm2 ON pm2.match_id = m.match_id AND ((pm.player_slot < 128) != (pm2.player_slot < 128)) WHERE pm.hero_id=${heroId} AND pm2.hero_id IN (${enemyIds}) AND pm.${col} > 0 GROUP BY pm.${col}`;
  });
  return `SELECT item_id, sum(games) as games, sum(wins) as wins FROM (${slots.join(' UNION ALL ')}) t GROUP BY item_id ORDER BY games DESC LIMIT 15`;
}

export function fetchHeroItemsAgainstEnemies(
  heroId: number,
  enemyHeroIds: number[],
): Promise<ExplorerResponse> {
  const sql = buildExplorerSql(heroId, enemyHeroIds);
  const cacheKey = `opendota:explorer:items:${heroId}:${enemyHeroIds.sort().join(',')}`;
  return fetchJson<ExplorerResponse>(
    `/explorer?sql=${encodeURIComponent(sql)}`,
    cacheKey,
    TTL_EXPLORER,
  );
}

export function fetchHeroDurations(heroId: number): Promise<HeroDuration[]> {
  return fetchJson<HeroDuration[]>(
    `/heroes/${heroId}/durations`,
    `opendota:hero:${heroId}:durations`,
    TTL_DURATIONS,
  );
}

export function fetchHeroStats(): Promise<HeroStats[]> {
  return fetchJson<HeroStats[]>(
    '/heroStats',
    'opendota:heroStats',
    TTL_HERO_STATS,
  );
}

interface AllySynergyRow {
  ally_hero: number;
  games: string;
  wins: string;
}

interface AllySynergyExplorerResponse {
  rows: AllySynergyRow[];
}

function buildAllySynergySql(heroId: number, allyHeroIds: number[]): string {
  const allyIds = allyHeroIds.join(',');
  return `SELECT pm2.hero_id as ally_hero, count(*) as games, sum(case when (pm.player_slot < 128) = m.radiant_win then 1 else 0 end) as wins FROM player_matches pm JOIN matches m USING(match_id) JOIN player_matches pm2 ON pm2.match_id = m.match_id AND ((pm.player_slot < 128) = (pm2.player_slot < 128)) AND pm.hero_id != pm2.hero_id WHERE pm.hero_id=${heroId} AND pm2.hero_id IN (${allyIds}) GROUP BY pm2.hero_id ORDER BY games DESC`;
}

export async function fetchHeroAllyWinRates(
  heroId: number,
  allyHeroIds: number[],
): Promise<{ hero_id: number; games: number; wins: number }[]> {
  if (allyHeroIds.length === 0) {
    return [];
  }
  const sql = buildAllySynergySql(heroId, allyHeroIds);
  const cacheKey = `opendota:explorer:ally:${heroId}:${[...allyHeroIds].sort().join(',')}`;
  const response = await fetchJson<AllySynergyExplorerResponse>(
    `/explorer?sql=${encodeURIComponent(sql)}`,
    cacheKey,
    TTL_ALLY_SYNERGY,
  );
  return response.rows.map(row => ({
    hero_id: row.ally_hero,
    games: parseInt(row.games, 10),
    wins: parseInt(row.wins, 10),
  }));
}
