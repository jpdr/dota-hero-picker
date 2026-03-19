import { Hero, PlayerHeroStat, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry, MatchupResult, Recommendation } from '@/types/recommendation';
import {
  SCORE_WEIGHT_WIN_RATE,
  SCORE_WEIGHT_MATCHUP,
  SCORE_WEIGHT_EXPERIENCE,
  TOP_RECOMMENDATIONS_COUNT,
} from '@/constants';

export function buildHeroPool(
  playerHeroes: PlayerHeroStat[],
  heroes: Hero[],
  minGames = 10,
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
): number {
  return (playerWinRate * SCORE_WEIGHT_WIN_RATE)
    + (avgMatchupAdvantage * SCORE_WEIGHT_MATCHUP)
    + (Math.log10(Math.max(matchesPlayed, 1)) * SCORE_WEIGHT_EXPERIENCE);
}

export function generateReasons(
  playerWinRate: number,
  matchupDetails: { enemyName: string; advantage: number }[],
  matchesPlayed: number,
): string[] {
  const reasons: string[] = [];

  reasons.push(`You have ${(playerWinRate * 100).toFixed(0)}% win rate`);

  for (const detail of matchupDetails) {
    const sign = detail.advantage >= 0 ? '+' : '';
    reasons.push(`${detail.advantage >= 0 ? 'Strong' : 'Weak'} against ${detail.enemyName} (${sign}${(detail.advantage * 100).toFixed(1)}%)`);
  }

  if (matchesPlayed >= 100) {
    reasons.push(`${matchesPlayed} games played — high confidence`);
  } else if (matchesPlayed >= 50) {
    reasons.push(`${matchesPlayed} games played — moderate confidence`);
  } else {
    reasons.push(`${matchesPlayed} games played — low confidence`);
  }

  return reasons;
}

export function scoreHeroPool(
  heroPool: HeroPoolEntry[],
  matchupResults: (HeroMatchup[] | null)[],
  enemyHeroIds: number[],
  heroes: Hero[],
): Recommendation[] {
  const heroMap = new Map(heroes.map(h => [h.id, h]));

  const scored: Recommendation[] = heroPool.map((entry, index) => {
    const matchups = matchupResults[index];

    const { average, details } = matchups
      ? computeMatchupAdvantage(matchups, enemyHeroIds)
      : { average: 0, details: [] };

    const matchupDetails: MatchupResult[] = details.map(d => ({
      enemyHero: heroMap.get(d.heroId) ?? { id: d.heroId, name: '', localized_name: 'Unknown', primary_attr: '', attack_type: '', roles: [], img: '', icon: '' },
      advantage: d.advantage,
      gamesPlayed: d.gamesPlayed,
    }));

    const compositeScore = computeCompositeScore(entry.winRate, average, entry.games);

    const reasons = generateReasons(
      entry.winRate,
      details.map(d => ({
        enemyName: heroMap.get(d.heroId)?.localized_name ?? 'Unknown',
        advantage: d.advantage,
      })),
      entry.games,
    );

    return {
      hero: entry.hero,
      compositeScore,
      playerWinRate: entry.winRate,
      averageMatchupAdvantage: average,
      matchesPlayed: entry.games,
      matchupDetails,
      reasons,
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  return scored.slice(0, TOP_RECOMMENDATIONS_COUNT);
}
