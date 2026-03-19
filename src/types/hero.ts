export interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
}

export interface PlayerHeroStat {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

export interface HeroMatchup {
  hero_id: number;
  games_played: number;
  wins: number;
}

export interface HeroDuration {
  duration_bin: number;
  games_played: number;
  wins: number;
}
