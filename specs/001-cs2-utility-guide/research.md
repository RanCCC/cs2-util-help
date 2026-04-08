# Research: CS2 Interactive Utility Lineup Guide

**Branch**: `001-cs2-utility-guide` | **Date**: 2026-04-05

## Build Tooling

**Decision**: Vite
**Rationale**: CRA is deprecated and no longer recommended by the React team. Vite offers a faster dev server, simpler configuration, and produces a static `dist/` folder. It is the current standard for new React projects.
**Alternatives considered**:
- Create React App — deprecated, slower, heavier config
- Parcel — simpler zero-config but less ecosystem support than Vite
- Next.js — SSR-focused, excessive for a locally-served app

## Local Server & Launcher (Non-Tech User Setup)

**Decision**: Thin Express server launched via a `.bat` file (double-click to start)
**Rationale**: The app requires file system access for reading/writing lineup assets to local disk. A pure static file approach won't work — the File System Access API is Chromium-only, requires re-granting permissions every session, and cannot auto-open a specific folder on startup. A small Express server (~50 lines) serves both the built frontend and exposes a REST API for file operations. A `.bat` launcher runs `node server.js` and auto-opens the browser — one double-click for non-tech users.
**Alternatives considered**:
- `npx serve` — static only, no file system write capability
- Electron — provides native file access but adds ~100MB+ to distribution; overkill for this use case
- Python http.server — adds a second runtime dependency (Python), no file write API
- File System Access API (browser-only) — Chromium-only, permission friction, unreliable for persistent data

**Setup requirement**: Users need Node.js installed. The `.bat` launcher can check for Node and provide a download link if missing. Alternatively, the app can be distributed with a bundled Node binary (node.exe ~40MB) to make it truly zero-install.

## Video Compression (Client-Side)

**Decision**: FFmpeg.wasm
**Rationale**: The only viable browser-side option for VP9 re-encoding. It handles stripping audio and encoding to WebM/VP9. ~30MB loaded but this is acceptable for a local desktop tool.
**Alternatives considered**:
- WebCodecs API — Chrome-only, can strip audio but cannot encode to VP9 reliably across browsers
- Server-side FFmpeg — would require bundling FFmpeg binary (~80MB); browser-side is simpler for distribution
- No re-encoding (accept only WebM) — too restrictive; users will have MP4 recordings from screen capture tools

## Image Compression (Client-Side)

**Decision**: `browser-image-compression` library
**Rationale**: Single dependency, single function call API. ~12KB gzipped. Handles EXIF rotation, format detection, and quality iteration automatically. Output as WebP for storage.
**Alternatives considered**:
- Manual Canvas API — saves ~12KB but requires handling edge cases (EXIF rotation, format detection, quality iteration loop) manually. Not worth the complexity.

## ZIP Handling (Client-Side)

**Decision**: `fflate`
**Rationale**: ~8KB gzipped, faster than alternatives, simple API for both creating and reading ZIP files. Supports streaming for large archives.
**Alternatives considered**:
- JSZip — more popular but ~45KB gzipped, slower. No meaningful API advantage for our use case.
- Archiver — Node-only, not suitable for browser use

## File System Strategy

**Decision**: Express REST API for all file operations
**Rationale**: Reliable, cross-browser, persistent. The Express server exposes endpoints for CRUD operations on the asset folder. Data is stored as JSON config files + media assets in a structured folder hierarchy. This approach also naturally supports the export/import ZIP functionality (server can read/write ZIP files from disk).
**Alternatives considered**:
- File System Access API — Chromium-only, permission friction, unreliable for persistent auto-loading
- IndexedDB/localStorage — size limits (typically 50MB-1GB), not file-based (can't share folders), doesn't match the "static config & assets" requirement
- SQLite (via better-sqlite3) — adds native module complexity, contradicts "no database" requirement

## Routing (Client-Side)

**Decision**: React Router (react-router-dom)
**Rationale**: The app has distinct views (home/map selection, map screen, lineup detail page). React Router is the standard solution, minimal config, and the detail page opens in a new tab via URL — which requires client-side routing to resolve the URL.
**Alternatives considered**:
- Manual state-based routing — workable for 2-3 views but lineup detail pages need shareable URLs (opened in new tabs), which requires proper URL routing

## State Management

**Decision**: React built-in state (useState, useContext, useReducer)
**Rationale**: The app's state is relatively simple — active map, active category, selected landing point, edit/view mode. No global state complexity that warrants an external library. Data is fetched from the server per-map and per-category.
**Alternatives considered**:
- Redux/Zustand — unnecessary overhead for this app's state complexity
- TanStack Query — useful for server-state caching but adds a dependency; simple fetch + state is sufficient given local server with near-zero latency

## CSS / Styling

**Decision**: CSS Modules (built into Vite)
**Rationale**: Zero additional dependencies. Scoped styles per component. Vite supports CSS Modules out of the box. For a tool app without complex design system needs, this is the simplest approach.
**Alternatives considered**:
- Tailwind CSS — adds build config and learning curve; overkill for a utility tool
- styled-components — runtime overhead, additional dependency
- Plain CSS — global scope collisions as app grows

## Summary: Final Tech Stack

| Layer | Technology | Size/Weight |
|-------|-----------|-------------|
| Build | Vite | Dev dependency only |
| Frontend | React 19 + React Router | Core framework |
| Styling | CSS Modules | Built into Vite |
| State | React built-in (useState/useContext) | Zero deps |
| Backend | Express (minimal REST API) | ~200KB |
| Image compression | browser-image-compression | ~12KB gzipped |
| Video compression | FFmpeg.wasm | ~30MB (loaded on demand) |
| ZIP handling | fflate | ~8KB gzipped |
| Launcher | `.bat` file (Windows) | One file |

**Total additional npm dependencies**: 5 (react-router-dom, express, browser-image-compression, @ffmpeg/ffmpeg + @ffmpeg/util, fflate)
