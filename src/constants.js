/** Utility categories available in CS2 */
export const CATEGORIES = [
  { id: 'smoke', name: 'Smoke' },
  { id: 'flash', name: 'Flash' },
  { id: 'molotov', name: 'Molotov' },
  { id: 'grenade', name: 'Grenade' },
];

export const DEFAULT_CATEGORY = 'smoke';

/** File size limits (bytes) — after compression */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB

/** Accepted upload formats */
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

/** Validation limits */
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_CREATOR_LENGTH = 50;

/** Coordinate tolerance for duplicate detection (1% of map dimensions) */
export const DUPLICATE_TOLERANCE = 0.01;

/** Preview overlay minimum size as fraction of window */
export const OVERLAY_MIN_SIZE_FRACTION = 0.25;

/** API base URL */
export const API_BASE = '/api';

/** Server port */
export const SERVER_PORT = 3001;
