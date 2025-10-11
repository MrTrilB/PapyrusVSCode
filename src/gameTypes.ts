export type GameProfile = 'Skyrim' | 'Fallout' | 'Starfield';

export type GameProfileKey = 'skyrim' | 'fallout' | 'starfield';

export const SUPPORTED_GAMES: GameProfile[] = ['Skyrim', 'Fallout', 'Starfield'];

export const GAME_TO_PROFILE_KEY: Record<GameProfile, GameProfileKey> = {
  Skyrim: 'skyrim',
  Fallout: 'fallout',
  Starfield: 'starfield'
};

export const PROFILE_KEY_TO_GAME: Record<GameProfileKey, GameProfile> = {
  skyrim: 'Skyrim',
  fallout: 'Fallout',
  starfield: 'Starfield'
};
