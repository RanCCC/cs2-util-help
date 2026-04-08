# Feature Specification: CS2 Interactive Utility Lineup Guide

**Feature Branch**: `001-cs2-utility-guide`
**Created**: 2026-04-05
**Status**: Draft
**Input**: User description: "Build a web app as 'utility usage guide' for Counter-Strike 2 — an interactive map-based reference for viewing, creating, and sharing in-game utility lineups."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Utility Lineups on a Map (Priority: P1)

A player opens the app before a match to review smoke lineups on a specific map. They select the map from the home screen, see the map image with landing-point markers for smokes (the default category). They click a landing point and see one or more starting-point markers connected by dotted lines. Hovering over a starting point shows a preview image of the lineup (at least ¼ of the window). Clicking a starting point opens a new browser tab with the full lineup detail page — including the lineup video, starting-position screenshot, and lineup screenshot.

**Why this priority**: This is the core read-only experience that delivers value on day one. A player can reference lineups during warm-up or mid-game without any content-creation features.

**Independent Test**: Load any map that has at least one lineup configured. Verify the full view flow end-to-end: map selection → landing points → starting points → hover preview → click-through to detail page.

**Acceptance Scenarios**:

1. **Given** the home screen is displayed, **When** a user selects a map, **Then** the map image is shown with landing-point markers for the default utility category (smoke)
2. **Given** a map is displayed with landing points, **When** a user clicks a landing point, **Then** all starting points for that landing point appear, connected to it by dotted lines
3. **Given** starting points are visible, **When** a user hovers over a starting point, **Then** a preview overlay appears next to the marker showing the lineup screenshot; the overlay is at least ¼ of the current window size
4. **Given** starting points are visible, **When** the user's mouse leaves a starting point, **Then** the preview overlay disappears
5. **Given** starting points are visible, **When** a user clicks a starting point, **Then** a new browser tab opens showing the lineup detail page with the video recording, starting-position image, and lineup image
6. **Given** starting points are visible, **When** a user clicks anywhere outside the landing point (on empty map area), **Then** the starting points and dotted lines disappear

---

### User Story 2 — Filter by Utility Category (Priority: P2)

A player wants to review flash lineups instead of smokes. They use the side panel to switch the active utility category. The map updates to show only the landing points for the selected category.

**Why this priority**: Filtering is essential for practical use — players need to focus on one utility type at a time. However, it builds on top of the core view experience (P1).

**Independent Test**: On a map with lineups in at least two different categories, switch categories via the side panel and verify only the selected category's landing points are shown.

**Acceptance Scenarios**:

1. **Given** a map is displayed, **When** the user views the side panel, **Then** four utility categories are listed: Smoke, Flash, Molotov, and Grenade, with Smoke selected by default
2. **Given** the side panel is visible, **When** the user selects a different category, **Then** the map updates to show only landing points belonging to that category
3. **Given** starting points are visible for a landing point, **When** the user switches category, **Then** the previous starting points and dotted lines disappear and the new category's landing points are shown

---

### User Story 3 — Create and Edit Lineups (Priority: P3)

A player discovers a new smoke lineup and wants to save it in the app. They switch to Edit mode on the current map, place a landing point and a starting point on the map, upload the required media (starting-position screenshot, lineup screenshot, and video recording), and provide a description and their name. The lineup is saved as static files in the asset folder. Later, they can edit or remove any lineup.

**Why this priority**: Content creation is what makes the app self-sustaining, but it depends on the view experience (P1) and category system (P2) being in place first.

**Independent Test**: In Edit mode, create a new lineup with all required assets, save it, switch to View mode, and verify the new lineup appears correctly with hover preview and detail page.

**Acceptance Scenarios**:

1. **Given** a map is displayed, **When** the user toggles to Edit mode, **Then** the interface switches to editing controls while still showing the map and existing markers
2. **Given** Edit mode is active, **When** the user initiates lineup creation, **Then** they are prompted to place a landing point and at least one starting point on the map
3. **Given** points are placed, **When** the user is prompted for media, **Then** they MUST upload three files: a starting-position screenshot, a lineup screenshot, and a video recording — all from their local filesystem
4. **Given** media is uploaded, **When** the user is prompted for metadata, **Then** they MUST provide a text description of the lineup and their name
5. **Given** all required information is provided, **When** the user saves the lineup, **Then** the lineup's configuration and assets are persisted to a dedicated subfolder under the map's asset directory, with a clarifying folder name derived from the date/timestamp, description, and user name
6. **Given** an existing lineup in Edit mode, **When** the user edits the lineup, **Then** they can update any field (points, media, metadata) and the folder name is updated to reflect the changes
7. **Given** an existing lineup in Edit mode, **When** the user removes the lineup, **Then** the lineup's folder and all its assets are deleted, and the marker disappears from the map
8. **Given** a lineup is saved or edited, **When** the user switches to View mode, **Then** the lineup is immediately visible and fully functional (hover preview, click-through detail page)

---

### User Story 4 — Add Multiple Starting Points to a Landing Point (Priority: P4)

A player knows three different positions from which the same smoke can be thrown. They add multiple starting points to a single landing point, each with its own media and metadata. In View mode, clicking the landing point reveals all starting points.

**Why this priority**: This is a natural extension of the creation flow (P3) that reflects real gameplay — the same utility can often be thrown from multiple positions.

**Independent Test**: Create a landing point with two or more starting points. In View mode, click the landing point and verify all starting points appear with individual hover previews and detail pages.

**Acceptance Scenarios**:

1. **Given** Edit mode is active and a landing point exists, **When** the user adds another starting point to it, **Then** the new starting point is associated with the same landing point
2. **Given** a landing point has multiple starting points, **When** a user clicks the landing point in View mode, **Then** all associated starting points appear with individual dotted lines connecting them to the landing point
3. **Given** multiple starting points are visible, **When** the user hovers over any one starting point, **Then** only that starting point's preview overlay is shown

---

### User Story 5 — Map Navigation (Priority: P5)

A player finishes reviewing lineups on one map and wants to switch to a different map, or return to the home screen to pick another.

**Why this priority**: Navigation is important for usability but is a simpler feature that supports the overall experience.

**Independent Test**: From any map screen, navigate back to the home page, select a different map, and verify it loads correctly.

**Acceptance Scenarios**:

1. **Given** a user is on the map screen, **When** they activate the back/home navigation, **Then** they are returned to the map selection (home) screen
2. **Given** the home screen, **When** the user selects a different map, **Then** that map loads with its own set of utility lineups

---

### User Story 6 — Export and Import Lineups (Priority: P6)

A player wants to share their lineup collection for a specific map with a friend over Discord. They select one, several, or all lineups on a map and export them as a ZIP file. The friend imports the ZIP into their own instance of the app.

**Why this priority**: Sharing is a social feature that extends the app's reach but requires the full creation and viewing pipeline to be functional first.

**Independent Test**: Export a set of lineups as a ZIP, import the ZIP into a fresh instance (or one with some overlapping lineups), and verify the import summary correctly reports added and ignored (duplicate) lineups.

**Acceptance Scenarios**:

1. **Given** a map with lineups, **When** the user initiates export, **Then** they can select individual lineups or use a "Select All" button to select all lineups on the current map
2. **Given** lineups are selected for export, **When** the user confirms, **Then** a ZIP file is generated containing the selected lineups' configuration and assets (organized by map), and offered for download
3. **Given** the user wants to export everything, **When** they choose the "Export All Maps" option, **Then** a single ZIP is generated containing all lineups across all maps, organized by map subfolder
4. **Given** a user has a ZIP file from another user, **When** they import the ZIP, **Then** the system detects which map each lineup belongs to and routes them to the correct map asset folders automatically
5. **Given** some imported lineups duplicate existing lineups, **When** the import completes, **Then** duplicates are silently ignored and the user sees a summary listing which lineups were added and which were ignored, grouped by map
6. **Given** a ZIP contains lineups for multiple maps, **When** the import completes, **Then** all newly added lineups are immediately visible on their respective maps in View mode

---

### Edge Cases

- What happens when a user uploads a media file in an unsupported format? — The system MUST validate file types before accepting the upload and display an actionable error message listing accepted formats
- What happens when the user tries to save a lineup without all required media? — The save action MUST be disabled or blocked until all three required files (starting-position screenshot, lineup screenshot, video recording) are provided
- What happens when a user imports a ZIP with a corrupted or unrecognized structure? — The system MUST reject the import gracefully and inform the user that the file could not be processed
- What happens when a user clicks a landing point that has no starting points configured? — The system MUST show an empty state indicating no lineups are available for this landing point
- What happens when the user places a point outside the map image bounds? — The system MUST constrain point placement to within the map image area
- What happens when two users independently create identical lineups? — The duplicate detection during import MUST compare by landing/starting coordinates (within 1% of map dimensions tolerance) plus utility category; description and creator name are not part of the identity check

## Clarifications

### Session 2026-04-05

- Q: Should uploads be auto-compressed or rejected if over limit? → A: Auto-compress on upload — images resized/compressed automatically, videos re-encoded to strip audio and optimize; originals are not stored.
- Q: What video format should be used for stored recordings? → A: WebM (VP9) — smaller files at equivalent quality, excellent desktop browser support. All uploads re-encoded to WebM/VP9 with audio stripped.
- Q: How should duplicate lineups be detected during import? → A: Match by landing/starting coordinates (within tolerance, e.g., 1% of map dimensions) plus utility category. Coordinates + category are the identity; description and creator name are not considered.
- Q: Export scope options? → A: Per-map export with individual selection + "Select All" button; also a global "Export All Maps" option that bundles lineups across all maps into one ZIP.
- Q: Can imports span multiple maps? → A: Yes — the import process MUST detect which map each lineup belongs to and route them to the correct map folders automatically.
- Q: How does the ZIP identify which map a lineup belongs to? → A: ZIP mirrors asset folder structure — top-level folders are map names, lineup subfolders nested inside. No separate manifest needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a home screen listing all available maps as selectable options
- **FR-002**: System MUST render a user-provided map image as the primary interactive canvas for each map
- **FR-003**: System MUST display landing-point markers on the map, filtered by the currently selected utility category
- **FR-004**: System MUST support four utility categories: Smoke, Flash, Molotov, Grenade — with Smoke as the default
- **FR-005**: System MUST provide a side panel for switching between utility categories
- **FR-006**: System MUST reveal starting-point markers with dotted-line connections when a landing point is clicked
- **FR-007**: System MUST hide starting-point markers and connections when the user clicks outside the active landing point
- **FR-008**: System MUST display a preview overlay (minimum ¼ window size) of the lineup screenshot when the user hovers over a starting point
- **FR-009**: System MUST open a lineup detail page in a new browser tab when the user clicks a starting point
- **FR-010**: The lineup detail page MUST display: the video recording of the lineup, the starting-position screenshot, and the lineup screenshot
- **FR-011**: System MUST support two modes on the map screen: View mode and Edit mode
- **FR-012**: In Edit mode, users MUST be able to create new lineups by placing landing and starting points, uploading required media (starting-position screenshot, lineup screenshot, video recording), and providing a description and user name
- **FR-013**: In Edit mode, users MUST be able to edit existing lineups (update points, media, metadata) and remove lineups
- **FR-014**: System MUST persist all lineup data and assets as static files in a structured asset folder — no database
- **FR-015**: Each lineup's assets MUST be stored in a dedicated subfolder named using date/timestamp, description, and user name
- **FR-016**: Lineup subfolder names MUST be updated when a lineup is edited
- **FR-017**: System MUST support exporting selected lineups from a map as a ZIP file, with a "Select All" button to quickly select all lineups on the current map
- **FR-018**: System MUST support an "Export All Maps" option that generates a single ZIP containing all lineups across all maps, organized by map subfolder
- **FR-019**: System MUST support importing lineups from a ZIP file; the ZIP MUST use the same folder structure as the asset directory (top-level folders = map names, lineup subfolders nested inside), and the importer MUST route lineups to the correct map folders based on this structure
- **FR-020**: During import, duplicate lineups MUST be ignored and the user MUST see a summary of added vs. ignored lineups, grouped by map
- **FR-021**: System MUST allow users to navigate from any map screen back to the home (map selection) screen
- **FR-022**: Users MUST upload media files from their local filesystem when creating or editing lineups
- **FR-023**: System MUST organize assets with separate subfolders per map under a main asset folder
- **FR-024**: System MUST auto-compress uploaded images (resize and reduce quality) to stay within size limits; originals are not stored
- **FR-025**: System MUST auto-compress uploaded videos by stripping audio and re-encoding to WebM (VP9) format; originals are not stored
- **FR-026**: System MUST enforce maximum file size limits: 2 MB per image (after compression), 15 MB per video (after compression)

### Key Entities

- **Map**: A Counter-Strike 2 map represented by a name and a top-down image. Contains zero or more lineups across utility categories. Each map has its own subfolder in the asset directory
- **Utility Category**: One of four types — Smoke, Flash, Molotov, Grenade. Used to filter which landing points are displayed on a map
- **Landing Point**: A position on the map image representing where a utility lands. Belongs to one utility category. Has one or more associated starting points
- **Starting Point**: A position on the map image representing where a player throws a utility from. Associated with exactly one landing point. Contains: a lineup screenshot, a starting-position screenshot, a video recording, a text description, and the creator's name
- **Lineup**: The combination of one landing point and one starting point, plus its associated media assets and metadata. Stored as a self-contained subfolder with configuration and asset files

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from opening the app to viewing a specific lineup's detail page in under 4 clicks (home → map → landing point → starting point)
- **SC-002**: The preview overlay appears within 1 second of hovering over a starting point
- **SC-003**: A user can create a new lineup (place points, upload 3 files, enter metadata, save) in under 3 minutes
- **SC-004**: Switching utility categories updates the displayed markers within 1 second
- **SC-005**: Exporting 50 lineups as a ZIP completes within 30 seconds
- **SC-006**: Importing a ZIP of 50 lineups completes within 30 seconds and displays an accurate summary
- **SC-007**: A user unfamiliar with the app can successfully view a lineup on their first attempt without external instructions
- **SC-008**: All lineup data and assets survive a full app restart with no data loss (static file persistence)
- **SC-009**: The app loads any map screen and renders all markers within 3 seconds on a standard broadband connection

## Assumptions

- Users have a modern desktop web browser (Chrome, Firefox, Edge) — mobile-responsive design is out of scope for v1
- Users will provide their own map images as static assets; the app does not source or generate map images
- The app is intended for personal or small-group use (single user at a time); concurrent multi-user editing is out of scope
- No user authentication is required — this is a local/personal tool
- Media uploads are auto-compressed client-side before storage: images to ≤ 2 MB, videos to ≤ 15 MB; originals are not retained. Videos are stripped of audio during compression
- The app runs as a local web server or static site; cloud hosting and deployment are out of scope for v1
- The number of maps is small (under 20) and the number of lineups per map is moderate (under 500); the app does not need to handle thousands of lineups per map
- Accepted upload image formats: PNG, JPG/JPEG, WebP — stored as compressed WebP. Accepted upload video formats: MP4, WebM — stored as WebM (VP9), audio stripped, targeting 10–20 second clips
- The "main asset folder" path is configurable or uses a well-known default location relative to the app
