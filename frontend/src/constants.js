export const CATEGORIES = [
  'Food',
  'Museums',
  'Skating',
  'Games',
  'Movies',
  'Exploring Pittsburgh',
  'Sports',
  'Other',
];

// ids must stay in sync with TRANSPORT_METHODS in backend/server.js
export const TRANSPORT_OPTIONS = [
  { id: 'walk', label: 'Walk' },
  { id: 'transit', label: 'Public transit' },
  { id: 'drive', label: 'Drive' },
  { id: 'rideshare', label: 'Rideshare' },
  { id: 'bike', label: 'Bike' },
];

export const SCHOOL_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', "Master's", 'PhD', 'Other'];

export const LANGUAGES = [
  'English', 'Spanish', 'Mandarin', 'Hindi', 'French',
  'Portuguese', 'Korean', 'Japanese', 'German', 'Other',
];

export const LANGUAGE_FLAGS = {
  English: '🇺🇸',
  Spanish: '🇪🇸',
  Mandarin: '🇨🇳',
  Hindi: '🇮🇳',
  French: '🇫🇷',
  Portuguese: '🇵🇹',
  Korean: '🇰🇷',
  Japanese: '🇯🇵',
  German: '🇩🇪',
  Other: '🌐',
};