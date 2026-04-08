import { API_BASE } from '../constants';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Fetch the list of available maps */
export function getMaps() {
  return fetchJson(`${API_BASE}/maps`);
}

/** Get the URL for a map's image */
export function getMapImageUrl(mapId) {
  return `${API_BASE}/maps/${mapId}/image`;
}

/** Fetch all lineups for a map, optionally filtered by category */
export function getLineups(mapId, category) {
  const params = category ? `?category=${category}` : '';
  return fetchJson(`${API_BASE}/maps/${mapId}/lineups${params}`);
}

/** Get the URL for a lineup asset file */
export function getAssetUrl(mapId, folder, filename) {
  return `${API_BASE}/maps/${mapId}/lineups/${folder}/${filename}`;
}

/** Create a new lineup with multipart form data */
export async function createLineup(mapId, formData) {
  const res = await fetch(`${API_BASE}/maps/${mapId}/lineups`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Create failed: ${res.status}`);
  }
  return res.json();
}

/** Update an existing lineup with multipart form data */
export async function updateLineup(mapId, lineupId, formData) {
  const res = await fetch(`${API_BASE}/maps/${mapId}/lineups/${lineupId}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Update failed: ${res.status}`);
  }
  return res.json();
}

/** Add a new starting point to an existing lineup */
export async function addStartingPoint(mapId, lineupId, formData) {
  const res = await fetch(`${API_BASE}/maps/${mapId}/lineups/${lineupId}/starting-points`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Add starting point failed: ${res.status}`);
  }
  return res.json();
}

/** Export selected lineups as a ZIP download */
export async function exportLineups(mapId, lineupIds) {
  const res = await fetch(`${API_BASE}/maps/${mapId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineupIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed: ${res.status}`);
  }
  return res.blob();
}

/** Export all maps' lineups as a ZIP download */
export async function exportAllMaps() {
  const res = await fetch(`${API_BASE}/export-all`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed: ${res.status}`);
  }
  return res.blob();
}

/** Import lineups from a ZIP file */
export async function importLineups(zipFile) {
  const formData = new FormData();
  formData.append('zipFile', zipFile);
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Import failed: ${res.status}`);
  }
  return res.json();
}

/** Delete a lineup */
export async function deleteLineup(mapId, lineupId) {
  const res = await fetch(`${API_BASE}/maps/${mapId}/lineups/${lineupId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Delete failed: ${res.status}`);
  }
  return res.json();
}
