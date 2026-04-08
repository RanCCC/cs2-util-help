# API Contracts: CS2 Utility Lineup Guide

**Branch**: `001-cs2-utility-guide` | **Date**: 2026-04-05

The Express backend exposes a REST API for all file system operations. The frontend communicates with these endpoints to read/write lineup data and assets.

**Base URL**: `http://localhost:3001/api`

---

## Maps

### GET /api/maps

List all available maps.

**Response** `200 OK`:
```json
{
  "maps": [
    { "id": "dust2", "name": "Dust 2", "folder": "dust2", "image": "map.png" },
    { "id": "mirage", "name": "Mirage", "folder": "mirage", "image": "map.png" }
  ]
}
```

### GET /api/maps/:mapId/image

Serve the map image file.

**Response** `200 OK`: Binary image data (PNG/JPG/WebP)
**Response** `404 Not Found`: `{ "error": "Map not found" }`

---

## Lineups

### GET /api/maps/:mapId/lineups

Get all lineups for a map.

**Query params**:
- `category` (optional): Filter by utility category (`smoke`, `flash`, `molotov`, `grenade`)

**Response** `200 OK`:
```json
{
  "mapId": "dust2",
  "lineups": [
    {
      "id": "20260405-143022_a-site-smoke_playerone",
      "category": "smoke",
      "description": "A site smoke from long doors",
      "creator": "PlayerOne",
      "createdAt": "2026-04-05T14:30:22Z",
      "updatedAt": "2026-04-05T14:30:22Z",
      "landingPoint": { "x": 0.65, "y": 0.32 },
      "startingPoints": [
        {
          "id": "sp1",
          "position": { "x": 0.42, "y": 0.58 },
          "description": "From long doors corner",
          "creator": "PlayerOne",
          "folder": "20260405-143022_a-site-smoke_playerone"
        }
      ]
    }
  ]
}
```

### POST /api/maps/:mapId/lineups

Create a new lineup. Uses `multipart/form-data` for file uploads.

**Form fields**:
- `category` (string, required): Utility category
- `description` (string, required): Lineup description (max 200 chars)
- `creator` (string, required): Creator name (max 50 chars)
- `landingX` (number, required): Landing point X coordinate (0–1)
- `landingY` (number, required): Landing point Y coordinate (0–1)
- `startingX` (number, required): Starting point X coordinate (0–1)
- `startingY` (number, required): Starting point Y coordinate (0–1)
- `startingDescription` (string, required): Starting point description
- `positionImage` (file, required): Starting-position screenshot
- `lineupImage` (file, required): Lineup crosshair screenshot
- `video` (file, required): Lineup video recording

**Response** `201 Created`:
```json
{
  "id": "20260405-143022_a-site-smoke_playerone",
  "message": "Lineup created successfully"
}
```

**Response** `400 Bad Request`:
```json
{
  "error": "Validation failed",
  "details": ["description is required", "positionImage is required"]
}
```

### PUT /api/maps/:mapId/lineups/:lineupId

Update an existing lineup. Uses `multipart/form-data`. All fields optional (only provided fields are updated).

**Form fields**: Same as POST, all optional. Files only needed if replacing media.

**Response** `200 OK`:
```json
{
  "id": "20260405-160000_updated-smoke_playerone",
  "message": "Lineup updated successfully"
}
```

**Response** `404 Not Found`: `{ "error": "Lineup not found" }`

### DELETE /api/maps/:mapId/lineups/:lineupId

Delete a lineup and its assets folder.

**Response** `200 OK`:
```json
{ "message": "Lineup deleted successfully" }
```

**Response** `404 Not Found`: `{ "error": "Lineup not found" }`

---

## Starting Points

### POST /api/maps/:mapId/lineups/:lineupId/starting-points

Add a new starting point to an existing landing point. Uses `multipart/form-data`.

**Form fields**:
- `startingX` (number, required): Starting point X coordinate (0–1)
- `startingY` (number, required): Starting point Y coordinate (0–1)
- `description` (string, required): Starting point description
- `creator` (string, required): Creator name
- `positionImage` (file, required): Starting-position screenshot
- `lineupImage` (file, required): Lineup crosshair screenshot
- `video` (file, required): Lineup video recording

**Response** `201 Created`:
```json
{
  "id": "sp2",
  "folder": "20260405-160500_alt-throw_playertwo",
  "message": "Starting point added successfully"
}
```

---

## Assets

### GET /api/maps/:mapId/lineups/:folder/position.webp

Serve the starting-position screenshot.

**Response** `200 OK`: Binary image (WebP)

### GET /api/maps/:mapId/lineups/:folder/lineup.webp

Serve the lineup crosshair screenshot.

**Response** `200 OK`: Binary image (WebP)

### GET /api/maps/:mapId/lineups/:folder/video.webm

Serve the lineup video recording.

**Response** `200 OK`: Binary video (WebM)

---

## Export / Import

### POST /api/maps/:mapId/export

Export selected lineups as a ZIP file.

**Request body** `application/json`:
```json
{
  "lineupIds": ["20260405-143022_a-site-smoke_playerone", "20260405-150100_b-site-flash_playertwo"]
}
```

Pass `"lineupIds": "all"` to export all lineups for the map.

**Response** `200 OK`: Binary ZIP file download
**Content-Disposition**: `attachment; filename="dust2-lineups.zip"`

### POST /api/export-all

Export all lineups across all maps as a single ZIP.

**Response** `200 OK`: Binary ZIP file download
**Content-Disposition**: `attachment; filename="cs2-lineups-all.zip"`

### POST /api/import

Import lineups from a ZIP file. Uses `multipart/form-data`.

**Form fields**:
- `zipFile` (file, required): ZIP file to import

**Response** `200 OK`:
```json
{
  "summary": {
    "totalProcessed": 12,
    "added": 8,
    "ignored": 4,
    "byMap": {
      "dust2": { "added": 5, "ignored": 2 },
      "mirage": { "added": 3, "ignored": 2 }
    }
  },
  "details": {
    "added": [
      { "map": "dust2", "description": "A site smoke from long doors", "id": "..." }
    ],
    "ignored": [
      { "map": "dust2", "description": "B tunnel smoke", "reason": "duplicate" }
    ]
  }
}
```

**Response** `400 Bad Request`:
```json
{ "error": "Invalid ZIP structure" }
```

---

## Error Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of specific issues"]
}
```

HTTP status codes used:
- `200` — Success
- `201` — Created
- `400` — Validation error or bad input
- `404` — Resource not found
- `500` — Server error (with actionable message, no stack traces)
