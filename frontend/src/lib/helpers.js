import {
  UtensilsCrossed,
  Landmark,
  Volleyball,
  Dices,
  Clapperboard,
  Compass,
  MoveDiagonal,
  Sparkles,
} from 'lucide-react';

import { SERVER_URL } from '../api';

// Converts a filename stored in the database into a usable image URL.
export function photoUrlFrom(filename) {
  return filename ? `${SERVER_URL}/uploads/${filename}` : undefined;
}

// Visual metadata (color + icon) for each category. Keyed by the exact
// strings already stored in the database (see constants.js CATEGORIES).
export const CATEGORY_META = {
  Food: { bg: '#FBE3D0', fg: '#9E531B', icon: UtensilsCrossed },
  Museums: { bg: '#E8E1F2', fg: '#5C4A88', icon: Landmark },
  Skating: { bg: '#DCEAF2', fg: '#2C6E8A', icon: MoveDiagonal },
  Games: { bg: '#D9E6F2', fg: '#37597A', icon: Dices },
  Movies: { bg: '#F5DCE2', fg: '#8A4058', icon: Clapperboard },
  'Exploring Pittsburgh': { bg: '#D5EAE6', fg: '#2E6A5F', icon: Compass },
  Sports: { bg: '#DCEBDD', fg: '#3E6B4C', icon: Volleyball },
  Other: { bg: '#F2ECE2', fg: '#5A5347', icon: Sparkles },
};

// Deterministic warm avatar color generated from a person's name.
const AVATAR_COLORS = [
  { bg: '#C41230', fg: '#FFF5F2' },
  { bg: '#D98E2C', fg: '#3A2606' },
  { bg: '#5B8A6B', fg: '#F2F8F3' },
  { bg: '#37597A', fg: '#EEF4FA' },
  { bg: '#8A4058', fg: '#FBEDF1' },
  { bg: '#5C4A88', fg: '#F0ECFA' },
  { bg: '#B5651D', fg: '#FBF1E6' },
  { bg: '#2E6A5F', fg: '#EAF6F3' },
];

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.round(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

export function formatEventDate(iso) {
  if (!iso) return { date: '', time: '', label: '' };
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { date, time, label: `${date} · ${time}` };
}

export function isSameDay(iso, ref) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}