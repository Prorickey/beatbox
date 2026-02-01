export const EMBED_COLORS = {
  PRIMARY: 0x7c3aed,    // violet-600
  SUCCESS: 0x22c55e,    // green-500
  ERROR: 0xef4444,      // red-500
  WARNING: 0xf59e0b,    // amber-500
  INFO: 0x3b82f6,       // blue-500
} as const;

export const PLAYER_DEFAULTS = {
  VOLUME: 80,
  MAX_QUEUE_SIZE: 500,
  MAX_HISTORY_SIZE: 50,
  SEARCH_LIMIT: 10,
} as const;

export const PROGRESS_BAR = {
  LENGTH: 15,
  FILLED: '\u2593',
  EMPTY: '\u2591',
  INDICATOR: '\uD83D\uDD18',
} as const;
