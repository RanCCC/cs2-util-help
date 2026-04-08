# Implementation Plan: CS2 Interactive Utility Lineup Guide

**Branch**: `001-cs2-utility-guide` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-cs2-utility-guide/spec.md`

## Summary

Build a locally-served React web app that lets CS2 players view, create, edit, and share utility lineup guides on interactive map images. The app uses a thin Express backend for file system persistence (JSON configs + media assets in structured folders), with client-side media compression (WebP images, WebM/VP9 video). Non-technical users launch via a `.bat` file on Windows.

## Technical Context

**Language/Version**: JavaScript (ES2022+), Node.js 20+
**Primary Dependencies**: React 19, React Router, Express, fflate, browser-image-compression, FFmpeg.wasm
**Storage**: Local file system — JSON config files + media assets in `data/` folder (no database)
**Testing**: Vitest (unit/integration), React Testing Library (component tests)
**Target Platform**: Windows 10+ desktop, modern browsers (Chrome, Firefox, Edge)
**Project Type**: Web application (React frontend + Express backend, locally served)
**Performance Goals**: < 200ms interactive operations, < 1s overlay display, < 3s map load, < 30s export/import of 50 lineups
**Constraints**: Minimal dependencies, easy setup for non-tech users, offline-capable (no external APIs), no database
**Scale/Scope**: < 20 maps, < 500 lineups per map, single concurrent user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single responsibility via component/service separation; named constants for limits/thresholds; TypeScript-level type safety via JSDoc; pinned dependencies in package.json |
| II. Testing Standards | PASS | Vitest + React Testing Library covers unit/integration; contract tests for API endpoints; 80% coverage target; mocks only at filesystem boundary |
| III. UX Consistency | PASS | Consistent marker interaction pattern across all categories; actionable error messages; loading/empty/error states planned per view; side panel navigation consistent |
| IV. Performance | PASS | Targets defined (SC-001 through SC-009); lazy-load FFmpeg.wasm; normalized coordinates for resolution independence; bounded data (< 500 lineups per map) |

### Post-Phase 1

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Data model uses normalized coordinates (no magic numbers); folder naming convention documented; API contract documented |
| II. Testing Standards | PASS | API contracts enable contract testing; data model validation rules are testable; duplicate detection has defined tolerance (1%) |
| III. UX Consistency | PASS | Consistent JSON error format across all API endpoints; overlay sizing rule (¼ window) applies uniformly |
| IV. Performance | PASS | Images compressed to ≤ 2 MB WebP, videos to ≤ 15 MB WebM; fflate chosen for ZIP (8KB vs 45KB JSZip); FFmpeg.wasm loaded on demand only in Edit mode |

## Project Structure

### Documentation (this feature)

```text
specs/001-cs2-utility-guide/
├── plan.md              # This file
├── research.md          # Phase 0 output — tech stack decisions
├── data-model.md        # Phase 1 output — entity definitions and file structure
├── quickstart.md        # Phase 1 output — setup and usage guide
├── contracts/
│   └── api.md           # Phase 1 output — REST API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
cs2-util-help/
├── start.bat                    # Windows launcher (double-click to run)
├── server.js                    # Express backend — serves frontend + REST API
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite build config with API proxy
├── src/                         # React frontend
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Root component with router
│   ├���─ constants.js             # Named constants (categories, limits, etc.)
│   ├── pages/
│   │   ├── HomePage.jsx         # Map selection grid
│   │   ├── HomePage.module.css
│   │   ├── MapPage.jsx          # Interactive map with markers
│   │   ├── MapPage.module.css
│   │   ├── DetailPage.jsx       # Lineup detail (video + images)
│   │   └── DetailPage.module.css
│   ├── components/
│   │   ├── MapCanvas.jsx        # Map image + marker rendering + click handling
│   │   ├── MapCanvas.module.css
│   │   ├── CategoryPanel.jsx    # Utility category side panel
│   ��   ├── CategoryPanel.module.css
│   │   ├── MarkerOverlay.jsx    # Hover preview overlay
│   │   ├── MarkerOverlay.module.css
│   │   ├── LineupForm.jsx       # Create/edit lineup form (Edit mode)
│   │   ├── LineupForm.module.css
│   │   ├── ExportDialog.jsx     # Export lineup selection + download
│   │   ├── ExportDialog.module.css
│   │   ├── ImportDialog.jsx     # Import ZIP + summary display
│   │   └── ImportDialog.module.css
│   └── services/
│       ├── api.js               # Fetch wrappers for backend API
│       ├── compression.js       # Image + video compression utilities
│       └── zipService.js        # Client-side ZIP creation/reading (fflate)
├── data/                        # All lineup data and assets (user content)
│   ├── maps.json                # Map registry
│   ├── dust2/
│   │   ├── map.png
│   │   ├── lineups.json
│   │   └── lineups/
│   └── mirage/
│       └── ...
└── tests/
    ├── unit/
    │   ├── compression.test.js
    │   ├── zipService.test.js
    │   └── constants.test.js
    ├── integration/
    │   ├── api.test.js          # API endpoint tests against real server
    │   └── import-export.test.js
    └── component/
        ├── MapCanvas.test.jsx
        ├── CategoryPanel.test.jsx
        ├── LineupForm.test.jsx
        └── MarkerOverlay.test.jsx
```

**Structure Decision**: Single project with Express backend serving the Vite-built frontend. No monorepo, no separate packages. The `server.js` lives at root — it serves `dist/` (built frontend) and exposes `/api/*` endpoints that read/write from `data/`. This is the simplest structure for a locally-served app with file system access.

## Complexity Tracking

No constitution violations to justify. The stack is intentionally minimal:
- 5 runtime npm dependencies (React Router, Express, fflate, browser-image-compression, FFmpeg.wasm)
- No database, no ORM, no state management library, no CSS framework
- Single `server.js` file for the entire backend
