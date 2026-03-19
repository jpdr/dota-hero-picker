import { HeroStats, HeroMetaScore, MetaTier } from '@/types/meta';

const RANK_BRACKETS = [1, 2, 3, 4, 5, 6, 7, 8];

function getBracketPicks(hero: HeroStats): number {
  let total = 0;
  for (const bracket of RANK_BRACKETS) {
    const val = hero[`${bracket}_pick`];
    if (typeof val === 'number') {
      total += val;
    }
  }
  return total;
}

function getBracketWins(hero: HeroStats): number {
  let total = 0;
  for (const bracket of RANK_BRACKETS) {
    const val = hero[`${bracket}_win`];
    if (typeof val === 'number') {
      total += val;
    }
  }
  return total;
}

export function computeMetaScores(heroStats: HeroStats[]): Map<number, HeroMetaScore> {
  const rawScores: { heroId: number; winRate: number; pickRate: number; proPresence: number }[] = [];

  let totalPicksAcrossAll = 0;
  for (const hero of heroStats) {
    totalPicksAcrossAll += getBracketPicks(hero);
  }

  for (const hero of heroStats) {
    const picks = getBracketPicks(hero);
    const wins = getBracketWins(hero);
    const winRate = picks > 0 ? wins / picks : 0;
    const pickRate = totalPicksAcrossAll > 0 ? picks / totalPicksAcrossAll : 0;
    const proPresence = (typeof hero.pro_pick === 'number' ? hero.pro_pick : 0)
      + (typeof hero.pro_ban === 'number' ? hero.pro_ban : 0);

    rawScores.push({ heroId: hero.id, winRate, pickRate, proPresence });
  }

  const maxProPresence = Math.max(...rawScores.map(s => s.proPresence), 1);
  const maxPickRate = Math.max(...rawScores.map(s => s.pickRate), 0.001);

  const scored: { heroId: number; winRate: number; pickRate: number; proPresence: number; metaScore: number }[] = [];

  for (const s of rawScores) {
    const normalizedWinRate = s.winRate;
    const normalizedPickRate = s.pickRate / maxPickRate;
    const normalizedProPresence = s.proPresence / maxProPresence;

    const metaScore = normalizedWinRate * 0.5 + normalizedPickRate * 0.2 + normalizedProPresence * 0.3;
    scored.push({ ...s, metaScore });
  }

  const maxMeta = Math.max(...scored.map(s => s.metaScore), 0.001);
  const minMeta = Math.min(...scored.map(s => s.metaScore));
  const range = maxMeta - minMeta || 1;

  for (const s of scored) {
    s.metaScore = (s.metaScore - minMeta) / range;
  }

  scored.sort((a, b) => b.metaScore - a.metaScore);

  const total = scored.length;
  const result = new Map<number, HeroMetaScore>();

  for (let i = 0; i < scored.length; i++) {
    const s = scored[i];
    const percentile = i / total;
    let tier: MetaTier;
    if (percentile < 0.1) {
      tier = 'S';
    } else if (percentile < 0.3) {
      tier = 'A';
    } else if (percentile < 0.6) {
      tier = 'B';
    } else if (percentile < 0.85) {
      tier = 'C';
    } else {
      tier = 'D';
    }

    result.set(s.heroId, {
      heroId: s.heroId,
      currentWinRate: s.winRate,
      pickRate: s.pickRate,
      proPresence: s.proPresence,
      metaScore: s.metaScore,
      tier,
    });
  }

  return result;
}
