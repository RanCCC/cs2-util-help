# Tasks: CS2 Interactive Utility Lineup Guide

**Input**: Design documents from `/specs/001-cs2-utility-guide/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization, dependency installation, and base configuration

- [x] T001 Initialize Node.js project with package.json (name: cs2-util-help, type: module, scripts: dev, dev:server, build, start, test) in package.json
- [x] T002 Install production dependencies: react, react-dom, react-router-dom, express, fflate, browser-image-compression, @ffmpeg/ffmpeg, @ffmpeg/util via npm
- [x] T003 Install dev dependencies: vite, @vitejs/plugin-react, vitest, @testing-library/react, @testing-library/jest-dom, jsdom via npm
- [x] T004 Create Vite config with React plugin and API proxy (localhost:3001) in vite.config.js
- [x] T005 [P] Create named constants file with utility categories, file size limits, coordinate tolerance, accepted formats in src/constants.js
- [x] T006 [P] Create seed data folder structure with maps.json (empty maps array) and sample map folders in data/maps.json and data/dust2/, data/mirage/
- [x] T007 [P] Create Windows launcher batch script that checks for Node.js, runs npm install if needed, builds frontend, starts server, opens browser in start.bat

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Express backend API and React app shell — MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Implement Express server that serves static files from dist/ and sets up /api route prefix with JSON error handling middleware in server.js
- [x] T009 Implement GET /api/maps endpoint that reads and returns data/maps.json in server.js
- [x] T010 Implement GET /api/maps/:mapId/image endpoint that serves map image files from data/:mapId/ in server.js
- [x] T011 Implement GET /api/maps/:mapId/lineups endpoint that reads and returns data/:mapId/lineups.json with optional category query filter in server.js
- [x] T012 Implement static asset serving for lineup media: GET /api/maps/:mapId/lineups/:folder/:filename in server.js
- [x] T013 [P] Create React app entry point with BrowserRouter in src/main.jsx
- [x] T014 [P] Create root App component with routes: / (home), /map/:mapId (map view), /map/:mapId/lineup/:lineupId/:startingPointId (detail page) in src/App.jsx
- [x] T015 [P] Create API service module with fetch wrappers for getMaps, getMapImage, getLineups in src/services/api.js

**Checkpoint**: Server runs, serves frontend shell, and returns map/lineup data from JSON files

---

## Phase 3: User Story 1 — View Utility Lineups on a Map (Priority: P1) MVP

**Goal**: Users can select a map, see landing-point markers, click to reveal starting points with dotted lines, hover for preview overlay, click through to detail page

**Independent Test**: Load a map with pre-configured lineups in data/. Verify: map renders → landing points shown → click landing point → starting points appear with dotted lines → hover shows preview (¼ window) → click opens detail page in new tab → click outside hides starting points

- [x] T016 [P] [US1] Create HomePage component that fetches maps from API and renders a selectable grid of map cards (name + thumbnail) in src/pages/HomePage.jsx and src/pages/HomePage.module.css
- [x] T017 [P] [US1] Create MapCanvas component that renders a map image, accepts markers as props, handles click events on markers and empty areas, and draws dotted SVG lines between connected points in src/components/MapCanvas.jsx and src/components/MapCanvas.module.css
- [x] T018 [US1] Create MapPage component that fetches lineups for the active map, renders MapCanvas with landing-point markers, manages selected landing point state (click to show starting points, click outside to hide) in src/pages/MapPage.jsx and src/pages/MapPage.module.css
- [x] T019 [US1] Create MarkerOverlay component that displays a lineup screenshot preview (minimum ¼ window size) positioned relative to the starting-point marker, shown on hover, hidden on mouse leave in src/components/MarkerOverlay.jsx and src/components/MarkerOverlay.module.css
- [x] T020 [US1] Integrate MarkerOverlay into MapPage so hovering a starting point fetches and displays the lineup.webp preview via the asset API endpoint in src/pages/MapPage.jsx
- [x] T021 [US1] Create DetailPage component that displays lineup video (video.webm), starting-position screenshot (position.webp), and lineup screenshot (lineup.webp) fetched from asset API endpoints in src/pages/DetailPage.jsx and src/pages/DetailPage.module.css
- [x] T022 [US1] Wire starting-point click in MapPage to open DetailPage URL in a new browser tab (window.open) in src/pages/MapPage.jsx
- [x] T023 [US1] Add sample lineup data to data/dust2/lineups.json and create a sample lineup subfolder with placeholder assets in data/dust2/lineups/ for manual testing

**Checkpoint**: Full view flow works end-to-end: home → map → landing point click → starting points + dotted lines → hover preview → click to detail page in new tab → click outside to dismiss

---

## Phase 4: User Story 2 — Filter by Utility Category (Priority: P2)

**Goal**: Side panel lets users switch between Smoke, Flash, Molotov, Grenade — map markers update accordingly

**Independent Test**: On a map with lineups in at least two categories, switch via side panel. Verify only selected category's landing points are shown; switching dismisses any active starting points

- [x] T024 [P] [US2] Create CategoryPanel component that renders four category buttons (Smoke, Flash, Molotov, Grenade) with Smoke selected by default, emits onCategoryChange callback in src/components/CategoryPanel.jsx and src/components/CategoryPanel.module.css
- [x] T025 [US2] Integrate CategoryPanel into MapPage: add category state, pass to API fetch (category query param), re-render markers when category changes, dismiss active starting points on switch in src/pages/MapPage.jsx

**Checkpoint**: Category switching filters landing points; switching categories clears active selection

---

## Phase 5: User Story 3 — Create and Edit Lineups (Priority: P3)

**Goal**: Edit mode lets users create new lineups (place points, upload media, enter metadata, save), edit existing lineups, and delete lineups

**Independent Test**: Toggle to Edit mode, create a lineup with all required assets, save, toggle to View mode, verify the new lineup appears with working preview and detail page. Edit the lineup, verify changes persist. Delete it, verify it disappears

- [x] T026 [US3] Implement POST /api/maps/:mapId/lineups endpoint with multer for multipart file upload, validation (required fields, coordinate range, file types), folder creation per naming convention, write lineup.json + lineups.json update in server.js
- [x] T027 [US3] Implement PUT /api/maps/:mapId/lineups/:lineupId endpoint with optional field updates, folder rename on metadata change, lineups.json update in server.js
- [x] T028 [US3] Implement DELETE /api/maps/:mapId/lineups/:lineupId endpoint that removes the lineup subfolder and updates lineups.json in server.js
- [x] T029 [P] [US3] Create compression service with compressImage (browser-image-compression → WebP, ≤ 2 MB) and compressVideo (FFmpeg.wasm → WebM VP9, strip audio, ≤ 15 MB) functions in src/services/compression.js
- [x] T030 [P] [US3] Add createLineup, updateLineup, deleteLineup functions to API service module (multipart/form-data requests) in src/services/api.js
- [x] T031 [US3] Create LineupForm component with: point placement mode (click map for landing/starting points), file upload inputs for 3 required media files with compression before upload, text inputs for description and creator name, save/cancel buttons, edit mode pre-fill, and validation (all fields required, file type checks) in src/components/LineupForm.jsx and src/components/LineupForm.module.css
- [x] T032 [US3] Add View/Edit mode toggle to MapPage: Edit mode shows LineupForm, enables point placement on MapCanvas clicks, shows edit/delete controls on existing markers in src/pages/MapPage.jsx
- [x] T033 [US3] Implement edit flow in MapPage: clicking an existing marker in Edit mode opens LineupForm pre-filled with that lineup's data, save calls PUT endpoint, data reloads in src/pages/MapPage.jsx
- [x] T034 [US3] Implement delete flow in MapPage: delete button on markers in Edit mode calls DELETE endpoint with confirmation prompt, removes marker and reloads data in src/pages/MapPage.jsx

**Checkpoint**: Full CRUD cycle works: create lineup with compressed media → view in View mode with preview + detail → edit lineup → delete lineup

---

## Phase 6: User Story 4 — Add Multiple Starting Points to a Landing Point (Priority: P4)

**Goal**: Users can add multiple starting points to the same landing point, each with its own media and detail page

**Independent Test**: Create a landing point, add two starting points with different media. In View mode, click the landing point — both starting points appear with individual dotted lines, individual hover previews, and individual detail pages

- [x] T035 [US4] Implement POST /api/maps/:mapId/lineups/:lineupId/starting-points endpoint with multer, creates new subfolder, updates lineups.json to add starting point to existing lineup entry in server.js
- [x] T036 [US4] Add addStartingPoint function to API service in src/services/api.js
- [x] T037 [US4] Extend LineupForm to support "Add Starting Point" mode: when an existing landing point is selected in Edit mode, allow adding a new starting point (place point, upload media, enter description/creator) without creating a new landing point in src/components/LineupForm.jsx
- [x] T038 [US4] Update MapPage to handle multiple starting points per landing point: clicking a landing point reveals all associated starting points, each with independent hover/click behavior in src/pages/MapPage.jsx
- [x] T039 [US4] Update DetailPage route to accept startingPointId param and load the correct starting point's assets from the corresponding subfolder in src/pages/DetailPage.jsx

**Checkpoint**: Multiple starting points render independently per landing point with individual previews and detail pages

---

## Phase 7: User Story 5 — Map Navigation (Priority: P5)

**Goal**: Users can navigate back to home from any map screen and switch between maps

**Independent Test**: From a map screen, click back/home navigation. Verify return to home screen. Select a different map, verify it loads with its own lineups

- [x] T040 [US5] Add a persistent navigation header/back button to MapPage that links back to HomePage (/) in src/pages/MapPage.jsx and src/pages/MapPage.module.css
- [x] T041 [US5] Add navigation header to DetailPage with back-to-map link in src/pages/DetailPage.jsx and src/pages/DetailPage.module.css
- [x] T042 [US5] Ensure MapPage resets all state (selected landing point, category, mode) when the mapId route param changes in src/pages/MapPage.jsx

**Checkpoint**: Navigation works between home ↔ map ↔ detail; state resets on map switch

---

## Phase 8: User Story 6 — Export and Import Lineups (Priority: P6)

**Goal**: Users can export selected lineups (per-map or all maps) as ZIP, import ZIP files with duplicate detection and summary

**Independent Test**: Export lineups from a map, import the ZIP into a fresh data folder, verify lineups appear. Import a ZIP with overlapping lineups, verify duplicates are ignored and summary is accurate

- [x] T043 [US6] Implement POST /api/maps/:mapId/export endpoint that reads selected lineup folders, creates ZIP (map-name/lineup-folders structure) using fflate, returns binary ZIP download in server.js
- [x] T044 [US6] Implement POST /api/export-all endpoint that creates ZIP with all maps' lineups organized by map subfolder in server.js
- [x] T045 [US6] Implement POST /api/import endpoint that accepts ZIP upload, parses folder structure to identify maps, detects duplicates by coordinate+category tolerance (1%), copies non-duplicate lineup folders, updates lineups.json per map, returns summary in server.js
- [x] T046 [P] [US6] Create ExportDialog component with lineup selection checkboxes, "Select All" button, "Export All Maps" option, and download trigger in src/components/ExportDialog.jsx and src/components/ExportDialog.module.css
- [x] T047 [P] [US6] Create ImportDialog component with ZIP file upload input, import trigger, and result summary display (added/ignored per map) in src/components/ImportDialog.jsx and src/components/ImportDialog.module.css
- [x] T048 [US6] Add exportLineups, exportAllMaps, importLineups functions to API service in src/services/api.js
- [x] T049 [US6] Integrate ExportDialog and ImportDialog into MapPage with trigger buttons visible in View mode in src/pages/MapPage.jsx

**Checkpoint**: Full export/import cycle works: select lineups → export ZIP → import ZIP on fresh instance → duplicates ignored → summary displayed

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [x] T050 Add loading states (spinner/skeleton) to HomePage (while fetching maps), MapPage (while fetching lineups), and DetailPage (while loading assets) in src/pages/HomePage.jsx, src/pages/MapPage.jsx, src/pages/DetailPage.jsx
- [x] T051 Add empty states to HomePage (no maps configured), MapPage (no lineups for selected category), and landing point click (no starting points) in src/pages/HomePage.jsx, src/pages/MapPage.jsx
- [x] T052 Add error states with actionable messages for API failures, file upload errors, and import failures across all pages in src/pages/HomePage.jsx, src/pages/MapPage.jsx, src/components/LineupForm.jsx, src/components/ImportDialog.jsx
- [x] T053 [P] Validate all user-facing text follows consistent terminology: "landing point" (not "land spot"), "starting point" (not "throw position"), "lineup" (not "setup") across all components
- [x] T054 [P] Add CORS headers and content-type validation to Express server for security hardening in server.js
- [x] T055 [P] Create data/dust2/ and data/mirage/ sample map folders with placeholder map images and 2-3 sample lineups each for first-run experience in data/
- [x] T056 Run quickstart.md validation: follow the quickstart steps on a clean checkout and verify the app starts and all features work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational phase — core view experience
- **US2 (Phase 4)**: Depends on US1 (needs MapPage and markers to exist)
- **US3 (Phase 5)**: Depends on US1 (needs view experience to validate created lineups)
- **US4 (Phase 6)**: Depends on US3 (needs lineup creation to add additional starting points)
- **US5 (Phase 7)**: Depends on US1 (needs MapPage and DetailPage to exist)
- **US6 (Phase 8)**: Depends on US3 (needs lineup creation for meaningful export/import)
- **Polish (Phase 9)**: Depends on all user stories being complete

### Parallel Opportunities

After Foundational (Phase 2) completes:
- **US1 (Phase 3)** must go first (core dependency for most stories)
- After US1: **US2 (Phase 4)** and **US5 (Phase 7)** can run in parallel
- After US3: **US4 (Phase 6)** and **US6 (Phase 8)** can run in parallel

### Within Each Phase

- Tasks marked [P] can run in parallel within their phase
- Non-[P] tasks must run sequentially in listed order
- Backend endpoints (server.js) can be built in parallel with frontend components if interfaces are agreed

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Express server + React shell)
3. Complete Phase 3: User Story 1 (view lineups)
4. **STOP and VALIDATE**: Full view flow works with sample data
5. Demo-ready: Users can browse existing lineups

### Incremental Delivery

1. Setup + Foundational → App shell runs
2. Add US1 → View lineups (MVP!)
3. Add US2 → Category filtering
4. Add US3 → Create/edit/delete lineups (full CRUD)
5. Add US4 → Multiple starting points
6. Add US5 → Navigation polish
7. Add US6 → Export/import sharing
8. Polish → Loading/empty/error states, sample data, validation

### Critical Path

```
Setup → Foundational → US1 → US3 → US4
                            → US2 (parallel after US1)
                            → US5 (parallel after US1)
                            → US6 (parallel after US3)
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Compression (T029) uses FFmpeg.wasm (~30MB loaded on demand) — only loads in Edit mode
- Backend tasks in server.js are additive (each endpoint is independent) — can be built incrementally
- Sample data (T023, T055) enables manual testing without requiring the full creation flow
