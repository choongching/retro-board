const KEY = 'retro.profile.v1';

export const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export type Profile = { id: string; name: string; color: string };

export function loadProfile(): Profile | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export function saveProfile(p: { name: string; color: string }): Profile {
  const existing = loadProfile();
  const profile: Profile = {
    id: existing?.id ?? crypto.randomUUID(),
    name: p.name,
    color: p.color,
  };
  localStorage.setItem(KEY, JSON.stringify(profile));
  return profile;
}
