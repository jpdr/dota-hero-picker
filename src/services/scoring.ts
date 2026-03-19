import { Hero, PlayerHeroStat, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry, MatchupResult, SynergyResult, Recommendation } from '@/types/recommendation';
import { LaneRoleStat, LaneType, HeroLaneData, LANE_ROLE_MAP } from '@/types/lane';
import { HeroMetaScore } from '@/types/meta';
import { TimingTag } from '@/services/timing';
import {
  SCORE_WEIGHT_WIN_RATE,
  SCORE_WEIGHT_MATCHUP,
  SCORE_WEIGHT_ALLY_SYNERGY,
  SCORE_WEIGHT_EXPERIENCE,
  SCORE_WEIGHT_META,
  TOP_RECOMMENDATIONS_COUNT,
  MIN_GAMES_DEFAULT,
} from '@/constants';

export function buildHeroPool(
  playerHeroes: PlayerHeroStat[],
  heroes: Hero[],
  minGames = MIN_GAMES_DEFAULT,
  minWinRate = 0.5,
): HeroPoolEntry[] {
  const heroMap = new Map(heroes.map(h => [h.id, h]));

  const entries: HeroPoolEntry[] = [];

  for (const ph of playerHeroes) {
    if (ph.games < minGames) {
      continue;
    }
    const hero = heroMap.get(ph.hero_id);
    if (!hero) {
      continue;
    }
    const winRate = ph.games > 0 ? ph.win / ph.games : 0;
    if (winRate < minWinRate) {
      continue;
    }
    entries.push({ hero, games: ph.games, wins: ph.win, winRate });
  }

  return entries.sort((a, b) => b.winRate - a.winRate);
}

interface MatchupDetail {
  heroId: number;
  advantage: number;
  gamesPlayed: number;
}

interface MatchupAdvantageResult {
  average: number;
  details: MatchupDetail[];
}

export function computeMatchupAdvantage(
  heroMatchups: HeroMatchup[],
  enemyHeroIds: number[],
): MatchupAdvantageResult {
  const matchupMap = new Map(heroMatchups.map(m => [m.hero_id, m]));
  const details: MatchupDetail[] = [];

  for (const enemyId of enemyHeroIds) {
    const matchup = matchupMap.get(enemyId);
    if (matchup && matchup.games_played > 0) {
      details.push({
        heroId: enemyId,
        advantage: (matchup.wins / matchup.games_played) - 0.5,
        gamesPlayed: matchup.games_played,
      });
    }
  }

  const average = details.length > 0
    ? details.reduce((sum, d) => sum + d.advantage, 0) / details.length
    : 0;

  return { average, details };
}

export function computeCompositeScore(
  playerWinRate: number,
  avgMatchupAdvantage: number,
  matchesPlayed: number,
  avgAllySynergy = 0,
  metaScore = 0,
): number {
  return (playerWinRate * SCORE_WEIGHT_WIN_RATE)
    + (avgMatchupAdvantage * SCORE_WEIGHT_MATCHUP)
    + (avgAllySynergy * SCORE_WEIGHT_ALLY_SYNERGY)
    + (Math.log10(Math.max(matchesPlayed, 1)) * SCORE_WEIGHT_EXPERIENCE)
    + (metaScore * SCORE_WEIGHT_META);
}

interface SynergyDetail {
  heroId: number;
  synergy: number;
  gamesPlayed: number;
}

interface SynergyAdvantageResult {
  average: number;
  details: SynergyDetail[];
}

export function computeAllySynergy(
  allyData: { hero_id: number; games: number; wins: number }[],
): SynergyAdvantageResult {
  const details: SynergyDetail[] = [];

  for (const ally of allyData) {
    if (ally.games > 0) {
      details.push({
        heroId: ally.hero_id,
        synergy: (ally.wins / ally.games) - 0.5,
        gamesPlayed: ally.games,
      });
    }
  }

  const average = details.length > 0
    ? details.reduce((sum, d) => sum + d.synergy, 0) / details.length
    : 0;

  return { average, details };
}

interface GenerateReasonsParams {
  playerWinRate: number;
  matchesPlayed: number;
  matchupDetails: { enemyName: string; advantage: number; gamesPlayed: number }[];
  synergyDetails: { allyName: string; synergy: number }[];
  metaScore?: HeroMetaScore;
  timingTag?: TimingTag;
}

export function generateReasons(params: GenerateReasonsParams): string[] {
  const { playerWinRate, matchesPlayed, matchupDetails, synergyDetails, metaScore, timingTag } = params;
  const reasons: string[] = [];

  const confidence = matchesPlayed >= 100 ? 'high confidence pick' : matchesPlayed >= 50 ? 'solid pick' : 'limited data';
  reasons.push(`You have ${(playerWinRate * 100).toFixed(0)}% win rate over ${matchesPlayed} games — ${confidence}`);

  for (const detail of matchupDetails) {
    const sign = detail.advantage >= 0 ? '+' : '';
    const label = detail.advantage >= 0 ? 'Strong counter to' : 'Weak against';
    const gamesLabel = detail.gamesPlayed >= 1000 ? `${(detail.gamesPlayed / 1000).toFixed(1)}k` : `${detail.gamesPlayed}`;
    reasons.push(`${label} ${detail.enemyName} (${sign}${(detail.advantage * 100).toFixed(1)}% advantage in ${gamesLabel} games)`);
  }

  for (const detail of synergyDetails) {
    const sign = detail.synergy >= 0 ? '+' : '';
    const label = detail.synergy >= 0 ? 'Great synergy with' : 'Poor synergy with';
    reasons.push(`${label} ${detail.allyName} (${sign}${(detail.synergy * 100).toFixed(1)}% when played together)`);
  }

  if (metaScore) {
    reasons.push(`${metaScore.tier}-tier in current meta (${(metaScore.currentWinRate * 100).toFixed(1)}% overall win rate)`);
  }

  if (timingTag && timingTag !== 'Balanced') {
    const timingDescriptions: Record<string, string> = {
      'Early Dominator': 'Early dominator — peaks before 25 min',
      'Mid-game Tempo': 'Mid-game tempo hero — peaks at 25-35 min',
      'Late-game Carry': 'Late-game carry — scales past 35 min',
    };
    reasons.push(timingDescriptions[timingTag]);
  }

  return reasons;
}

export function buildLaneDataMap(laneRoles: LaneRoleStat[]): Map<number, HeroLaneData> {
  const grouped = new Map<number, Map<number, { games: number; wins: number }>>();

  for (const stat of laneRoles) {
    const lane = LANE_ROLE_MAP[stat.lane_role];
    if (!lane) continue;

    if (!grouped.has(stat.hero_id)) {
      grouped.set(stat.hero_id, new Map());
    }
    const heroLanes = grouped.get(stat.hero_id)!;
    const existing = heroLanes.get(stat.lane_role) ?? { games: 0, wins: 0 };
    existing.games += parseInt(stat.games, 10);
    existing.wins += parseInt(stat.wins, 10);
    heroLanes.set(stat.lane_role, existing);
  }

  const result = new Map<number, HeroLaneData>();

  for (const [heroId, laneMap] of grouped) {
    const lanes: { lane: LaneType; games: number; winRate: number }[] = [];
    let maxGames = 0;
    let primaryLane: LaneType = 'safe';

    for (const [role, data] of laneMap) {
      const lane = LANE_ROLE_MAP[role];
      if (!lane) continue;
      const winRate = data.games > 0 ? data.wins / data.games : 0;
      lanes.push({ lane, games: data.games, winRate });
      if (data.games > maxGames) {
        maxGames = data.games;
        primaryLane = lane;
      }
    }

    result.set(heroId, { heroId, lanes, primaryLane });
  }

  return result;
}

export function filterPoolByLane(
  heroPool: HeroPoolEntry[],
  laneDataMap: Map<number, HeroLaneData>,
  laneType: LaneType,
): HeroPoolEntry[] {
  if (!laneType) return heroPool;

  return heroPool.filter(entry => {
    const laneData = laneDataMap.get(entry.hero.id);
    if (!laneData) return false;

    // Include hero if the selected lane is their primary lane,
    // or if they have significant games in that lane (>20% of their total lane games)
    if (laneData.primaryLane === laneType) return true;

    const totalGames = laneData.lanes.reduce((sum, l) => sum + l.games, 0);
    const laneGames = laneData.lanes.find(l => l.lane === laneType)?.games ?? 0;
    return totalGames > 0 && (laneGames / totalGames) > 0.2;
  });
}

interface ScoreHeroPoolParams {
  heroPool: HeroPoolEntry[];
  matchupResults: (HeroMatchup[] | null)[];
  enemyHeroIds: number[];
  heroes: Hero[];
  laneDataMap?: Map<number, HeroLaneData>;
  laneType?: LaneType;
  allyResults?: ({ hero_id: number; games: number; wins: number }[] | null)[];
  allyHeroIds?: number[];
  metaScores?: Map<number, HeroMetaScore>;
  timingTags?: Map<number, TimingTag>;
}

export function scoreHeroPool(params: ScoreHeroPoolParams): Recommendation[] {
  const {
    heroPool,
    matchupResults,
    enemyHeroIds,
    heroes,
    laneDataMap,
    laneType,
    allyResults,
    allyHeroIds,
    metaScores,
    timingTags,
  } = params;

  const heroMap = new Map(heroes.map(h => [h.id, h]));
  const unknownHero = (id: number): Hero => ({ id, name: '', localized_name: 'Unknown', primary_attr: '', attack_type: '', roles: [] });

  const scored: Recommendation[] = heroPool.map((entry, index) => {
    const matchups = matchupResults[index];

    const { average: matchupAvg, details: matchupDetailsList } = matchups
      ? computeMatchupAdvantage(matchups, enemyHeroIds)
      : { average: 0, details: [] };

    const matchupDetails: MatchupResult[] = matchupDetailsList.map(d => ({
      enemyHero: heroMap.get(d.heroId) ?? unknownHero(d.heroId),
      advantage: d.advantage,
      gamesPlayed: d.gamesPlayed,
    }));

    const allyData = allyResults?.[index];
    const { average: synergyAvg, details: synergyDetailsList } = allyData
      ? computeAllySynergy(allyData)
      : { average: 0, details: [] };

    const synergyDetails: SynergyResult[] = synergyDetailsList.map(d => ({
      allyHero: heroMap.get(d.heroId) ?? unknownHero(d.heroId),
      synergy: d.synergy,
      gamesPlayed: d.gamesPlayed,
    }));

    const heroMeta = metaScores?.get(entry.hero.id);
    const timingTag = timingTags?.get(entry.hero.id);

    const compositeScore = computeCompositeScore(
      entry.winRate,
      matchupAvg,
      entry.games,
      synergyAvg,
      heroMeta?.metaScore ?? 0,
    );

    const reasons = generateReasons({
      playerWinRate: entry.winRate,
      matchesPlayed: entry.games,
      matchupDetails: matchupDetailsList.map(d => ({
        enemyName: heroMap.get(d.heroId)?.localized_name ?? 'Unknown',
        advantage: d.advantage,
        gamesPlayed: d.gamesPlayed,
      })),
      synergyDetails: synergyDetailsList.map(d => ({
        allyName: heroMap.get(d.heroId)?.localized_name ?? 'Unknown',
        synergy: d.synergy,
      })),
      metaScore: heroMeta,
      timingTag,
    });

    if (laneDataMap && laneType) {
      const laneData = laneDataMap.get(entry.hero.id);
      if (laneData) {
        const laneLabel = laneType === 'safe' ? 'Safe Lane' : laneType === 'mid' ? 'Mid' : 'Offlane';
        if (laneData.primaryLane === laneType) {
          reasons.push(`Primary ${laneLabel} hero`);
        } else {
          const laneInfo = laneData.lanes.find(l => l.lane === laneType);
          if (laneInfo) {
            reasons.push(`Viable ${laneLabel} hero (${(laneInfo.winRate * 100).toFixed(0)}% lane WR)`);
          }
        }
      }
    }

    return {
      hero: entry.hero,
      compositeScore,
      playerWinRate: entry.winRate,
      averageMatchupAdvantage: matchupAvg,
      averageAllySynergy: synergyAvg,
      matchesPlayed: entry.games,
      matchupDetails,
      synergyDetails,
      reasons,
      timingTag,
      metaTier: heroMeta?.tier,
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  return scored.slice(0, TOP_RECOMMENDATIONS_COUNT);
}
