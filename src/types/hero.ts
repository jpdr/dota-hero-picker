export interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  img: string;
  icon: string;
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

export interface PlayerMatch {
  match_id: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
}
