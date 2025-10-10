export type GameProfile = 'Skyrim' | 'SkyrimSE' | 'SkyrimAE' | 'Fallout4' | 'Fallout76' | 'Starfield';

export type GameProfileKey = 'skyrim' | 'skyrimse' | 'skyrimae' | 'fallout4' | 'fallout76' | 'starfield';

export const SUPPORTED_GAMES: GameProfile[] = ['Skyrim', 'SkyrimSE', 'SkyrimAE', 'Fallout4', 'Fallout76', 'Starfield'];

export const GAME_TO_PROFILE_KEY: Record<GameProfile, GameProfileKey> = {
  Skyrim: 'skyrim',
  SkyrimSE: 'skyrimse',
  SkyrimAE: 'skyrimae',
  Fallout4: 'fallout4',
  Fallout76: 'fallout76',
  Starfield: 'starfield'
};

export const PROFILE_KEY_TO_GAME: Record<GameProfileKey, GameProfile> = {
  skyrim: 'Skyrim',
  skyrimse: 'SkyrimSE',
  skyrimae: 'SkyrimAE',
  fallout4: 'Fallout4',
  fallout76: 'Fallout76',
  starfield: 'Starfield'
};
