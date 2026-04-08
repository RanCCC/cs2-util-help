# Data Model: CS2 Interactive Utility Lineup Guide

**Branch**: `001-cs2-utility-guide` | **Date**: 2026-04-05

## Overview

All data is stored as static files on disk. Each map has a folder; each lineup has a subfolder containing a JSON config file and media assets. There is no database — the file system IS the database.

## Asset Folder Structure

```text
data/
├── maps.json                          # Registry of available maps
├── dust2/
│   ├── map.png                        # Top-down map image (user-provided)
│   ├── lineups.json                   # All lineup configs for this map
│   └── lineups/
│       ├── 20260405-143022_a-site-smoke_playerone/
│       │   ├── lineup.json            # Individual lineup config (redundant but self-contained for export)
│       │   ├── position.webp          # Starting-position screenshot (compressed)
│       │   ├── lineup.webp            # Lineup crosshair screenshot (compressed)
│       │   └── video.webm             # Lineup video recording (compressed, no audio)
│       └── 20260405-150100_b-site-flash_playertwo/
│           ├── lineup.json
│           ├── position.webp
│           ├── lineup.webp
│           └── video.webm
├── mirage/
│   ├── map.png
│   ├── lineups.json
│   └── lineups/
│       └── ...
└── ...
```

### Folder Naming Convention

Lineup subfolder name format: `{YYYYMMDD-HHMMSS}_{description-slug}_{username-slug}`

- `YYYYMMDD-HHMMSS`: Creation timestamp (updated on edit)
- `description-slug`: Lineup description, lowercased, spaces replaced with hyphens, max 40 chars
- `username-slug`: Creator name, lowercased, spaces replaced with hyphens, max 20 chars

When a lineup is edited, the folder is renamed to reflect the new timestamp and any updated description/name.

## Entities

### maps.json (Map Registry)

```json
{
  "maps": [
    {
      "id": "dust2",
      "name": "Dust 2",
      "folder": "dust2",
      "image": "map.png"
    },
    {
      "id": "mirage",
      "name": "Mirage",
      "folder": "mirage",
      "image": "map.png"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (matches folder name) |
| name | string | Yes | Display name for the UI |
| folder | string | Yes | Folder name under `data/` |
| image | string | Yes | Filename of the map image within the map folder |

### lineups.json (Per-Map Lineup Index)

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

### Lineup Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Matches the lineup subfolder name |
| category | enum | Yes | One of: `smoke`, `flash`, `molotov`, `grenade` |
| description | string | Yes | User-provided description of the lineup |
| creator | string | Yes | User-provided creator name |
| createdAt | ISO 8601 | Yes | Creation timestamp |
| updatedAt | ISO 8601 | Yes | Last edit timestamp |
| landingPoint | Point | Yes | Where the utility lands (normalized 0–1 coordinates) |
| startingPoints | StartingPoint[] | Yes | One or more throw positions (min 1) |

### Point (Value Object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| x | number | Yes | Horizontal position as fraction of map width (0.0–1.0) |
| y | number | Yes | Vertical position as fraction of map height (0.0–1.0) |

Coordinates are normalized (0–1) relative to the map image dimensions. This ensures positions are resolution-independent and consistent across different display sizes.

### StartingPoint Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique ID within the lineup (e.g., `sp1`, `sp2`) |
| position | Point | Yes | Where the player throws from (normalized 0–1 coordinates) |
| description | string | Yes | Description of this specific throw position |
| creator | string | Yes | Creator name for this starting point |
| folder | string | Yes | Subfolder name containing this starting point's assets |

### lineup.json (Per-Lineup Self-Contained Config)

Each lineup subfolder contains a `lineup.json` that duplicates the lineup's entry from `lineups.json`. This redundancy is intentional — it makes each lineup folder self-contained for export/import.

```json
{
  "id": "20260405-143022_a-site-smoke_playerone",
  "mapId": "dust2",
  "category": "smoke",
  "description": "A site smoke from long doors",
  "creator": "PlayerOne",
  "createdAt": "2026-04-05T14:30:22Z",
  "updatedAt": "2026-04-05T14:30:22Z",
  "landingPoint": { "x": 0.65, "y": 0.32 },
  "startingPoint": {
    "id": "sp1",
    "position": { "x": 0.42, "y": 0.58 },
    "description": "From long doors corner",
    "creator": "PlayerOne"
  },
  "assets": {
    "position": "position.webp",
    "lineup": "lineup.webp",
    "video": "video.webm"
  }
}
```

**Note**: Each subfolder represents ONE starting point for a lineup. If a landing point has multiple starting points, each is a separate subfolder. The `lineups.json` aggregates them under a single lineup entry by matching `landingPoint` coordinates + `category`.

### Utility Category (Enum)

| Value | Display Name | Default |
|-------|-------------|---------|
| `smoke` | Smoke | Yes (default selection) |
| `flash` | Flash | No |
| `molotov` | Molotov | No |
| `grenade` | Grenade | No |

## Duplicate Detection (Import)

Two lineups are considered duplicates when ALL of the following match:

1. Same `category`
2. `landingPoint.x` within 1% tolerance (±0.01)
3. `landingPoint.y` within 1% tolerance (±0.01)
4. `startingPoint.position.x` within 1% tolerance (±0.01)
5. `startingPoint.position.y` within 1% tolerance (±0.01)

Description and creator name are NOT part of the identity check.

## State Transitions

### Lineup Lifecycle

```
[Created] → [Saved] → [Edited] → [Saved]
                   ↘ [Deleted]
```

- **Created**: User places points and uploads media in Edit mode
- **Saved**: Lineup folder written to disk, `lineups.json` updated
- **Edited**: User modifies points/media/metadata; folder renamed, files updated
- **Deleted**: Folder removed from disk, entry removed from `lineups.json`

### View/Edit Mode

```
[View Mode] ⇄ [Edit Mode]
```

- Default: View Mode
- Toggle is per-map-screen, not global
- Switching to View Mode after edits triggers a data reload to reflect changes

## Validation Rules

- `category` MUST be one of the four valid enum values
- `landingPoint` and `startingPoint.position` coordinates MUST be in range [0.0, 1.0]
- `description` MUST be non-empty, max 200 characters
- `creator` MUST be non-empty, max 50 characters
- Each lineup MUST have at least one starting point
- Each starting point's subfolder MUST contain exactly 3 asset files: `position.webp`, `lineup.webp`, `video.webm`
- Asset file sizes after compression: images ≤ 2 MB, video ≤ 15 MB
