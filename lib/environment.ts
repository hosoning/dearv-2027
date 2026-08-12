export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type DayPhase = 'day' | 'night';
export type Weather = 'clear' | 'rain' | 'snow';

export interface EnvironmentSettings {
  season: 'auto' | Season;
  dayPhase: 'auto' | DayPhase;
  weather: 'auto' | Weather;
}

export interface ResolvedEnvironment {
  season: Season;
  dayPhase: DayPhase;
  weather: Weather;
  hour: number;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  season: 'auto',
  dayPhase: 'auto',
  weather: 'auto',
};

export function automaticSeason(date = new Date()): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function automaticDayPhase(date = new Date()): DayPhase {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

function daySeed(date: Date) {
  return Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
}

export function automaticWeather(date = new Date(), season = automaticSeason(date)): Weather {
  const seed = daySeed(date);
  const roll = ((seed * 9301 + 49297) % 233280) / 233280;
  if (season === 'winter' && roll < 0.28) return 'snow';
  if (roll < 0.22) return 'rain';
  return 'clear';
}

export function resolveEnvironment(settings: EnvironmentSettings, date = new Date()): ResolvedEnvironment {
  const season = settings.season === 'auto' ? automaticSeason(date) : settings.season;
  const dayPhase = settings.dayPhase === 'auto' ? automaticDayPhase(date) : settings.dayPhase;
  const weather = settings.weather === 'auto' ? automaticWeather(date, season) : settings.weather;
  return { season, dayPhase, weather, hour: date.getHours() };
}

export function loadEnvironmentSettings(): EnvironmentSettings {
  if (typeof window === 'undefined') return DEFAULT_ENVIRONMENT_SETTINGS;
  try {
    const raw = window.localStorage.getItem('dearv-environment');
    if (!raw) return DEFAULT_ENVIRONMENT_SETTINGS;
    return { ...DEFAULT_ENVIRONMENT_SETTINGS, ...(JSON.parse(raw) as Partial<EnvironmentSettings>) };
  } catch {
    return DEFAULT_ENVIRONMENT_SETTINGS;
  }
}

export function saveEnvironmentSettings(settings: EnvironmentSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('dearv-environment', JSON.stringify(settings));
  } catch {}
}
