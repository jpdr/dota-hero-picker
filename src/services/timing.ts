import { HeroDuration } from '@/types/hero';

export type TimingTag = 'Early Dominator' | 'Mid-game Tempo' | 'Late-game Carry' | 'Balanced';

export function classifyTiming(durations: HeroDuration[]): TimingTag {
  let earlyGames = 0, earlyWins = 0;
  let midGames = 0, midWins = 0;
  let lateGames = 0, lateWins = 0;

  for (const d of durations) {
    const bin = d.duration_bin;
    if (bin < 1500) {
      earlyGames += d.games_played;
      earlyWins += d.wins;
    } else if (bin <= 2100) {
      midGames += d.games_played;
      midWins += d.wins;
    } else {
      lateGames += d.games_played;
      lateWins += d.wins;
    }
  }

  const earlyWr = earlyGames > 0 ? earlyWins / earlyGames : 0;
  const midWr = midGames > 0 ? midWins / midGames : 0;
  const lateWr = lateGames > 0 ? lateWins / lateGames : 0;

  const totalGames = earlyGames + midGames + lateGames;
  const totalWins = earlyWins + midWins + lateWins;
  const avgWr = totalGames > 0 ? totalWins / totalGames : 0;

  const threshold = 0.03;

  const phases: { wr: number; tag: TimingTag }[] = [
    { wr: earlyWr, tag: 'Early Dominator' },
    { wr: midWr, tag: 'Mid-game Tempo' },
    { wr: lateWr, tag: 'Late-game Carry' },
  ];

  phases.sort((a, b) => b.wr - a.wr);

  if (phases[0].wr - avgWr >= threshold) {
    return phases[0].tag;
  }

  return 'Balanced';
}
