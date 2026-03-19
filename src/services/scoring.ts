import { Hero, PlayerHeroStat, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry } from '@/types/recommendation';

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
    entries.push({ hero, games: ph.games, wins: ph.win, winRate, kda: null });
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
  return (playerWinRate * 0.5) + (avgMatchupAdvantage * 0.4) + (Math.log10(Math.max(matchesPlayed, 1)) * 0.1);
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
