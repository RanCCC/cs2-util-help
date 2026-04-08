import express from 'express';
import { readFile, writeFile, mkdir, rm, rename, readdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
const DIST_DIR = resolve(__dirname, 'dist');
const PORT = process.env.PORT || 3001;

const VALID_CATEGORIES = ['smoke', 'flash', 'molotov', 'grenade'];
const MAX_DESCRIPTION = 200;
const MAX_CREATOR = 50;
const DUPLICATE_TOLERANCE = 0.01;

const app = express();

// CORS headers — restrict to same origin in production, allow localhost in dev
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Content-type validation for JSON endpoints
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    // Allow JSON and multipart (file uploads)
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(415).json({ error: 'Unsupported content type. Use application/json or multipart/form-data.' });
    }
  }
  next();
});

app.use(express.json());

// Multer config — store uploads in memory for validation before writing to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const lineupUpload = upload.fields([
  { name: 'positionImage', maxCount: 1 },
  { name: 'lineupImage', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);
const zipUpload = upload.single('zipFile');

/** Create a URL-safe slug from a string */
function slugify(str, maxLen) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, maxLen);
}

/** Generate a folder name from timestamp + description + creator */
function makeFolderName(description, creator) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').replace(/\..+/, '').replace(/(\d{8})(\d{6})/, '$1-$2');
  return `${ts}_${slugify(description, 40)}_${slugify(creator, 20)}`;
}

/** Read and parse a JSON file, returning null if not found */
async function readJsonFile(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, 'utf-8'));
}

/** Write JSON to a file with pretty formatting */
async function writeJsonFile(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** Validate lineup creation/update fields, returns array of error strings */
function validateLineupFields(body, files, isCreate) {
  const errors = [];
  if (isCreate) {
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) errors.push('category must be one of: ' + VALID_CATEGORIES.join(', '));
    if (!body.description?.trim()) errors.push('description is required');
    if (!body.creator?.trim()) errors.push('creator is required');
    if (!body.startingDescription?.trim()) errors.push('startingDescription is required');
    const coords = ['landingX', 'landingY', 'startingX', 'startingY'];
    for (const c of coords) {
      const v = parseFloat(body[c]);
      if (isNaN(v) || v < 0 || v > 1) errors.push(`${c} must be a number between 0 and 1`);
    }
    if (!files?.positionImage?.[0]) errors.push('positionImage is required');
    if (!files?.lineupImage?.[0]) errors.push('lineupImage is required');
    if (!files?.video?.[0]) errors.push('video is required');
  } else {
    if (body.category && !VALID_CATEGORIES.includes(body.category)) errors.push('category must be one of: ' + VALID_CATEGORIES.join(', '));
    for (const c of ['landingX', 'landingY', 'startingX', 'startingY']) {
      if (body[c] !== undefined) {
        const v = parseFloat(body[c]);
        if (isNaN(v) || v < 0 || v > 1) errors.push(`${c} must be a number between 0 and 1`);
      }
    }
  }
  if (body.description && body.description.length > MAX_DESCRIPTION) errors.push(`description max ${MAX_DESCRIPTION} characters`);
  if (body.creator && body.creator.length > MAX_CREATOR) errors.push(`creator max ${MAX_CREATOR} characters`);
  return errors;
}

// --- API Routes ---

// GET /api/maps — list all available maps
app.get('/api/maps', async (_req, res, next) => {
  try {
    const raw = await readFile(join(DATA_DIR, 'maps.json'), 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    next(err);
  }
});

// GET /api/maps/:mapId/image — serve the map image
app.get('/api/maps/:mapId/image', async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const mapsRaw = await readFile(join(DATA_DIR, 'maps.json'), 'utf-8');
    const { maps } = JSON.parse(mapsRaw);
    const mapEntry = maps.find((m) => m.id === mapId);

    if (!mapEntry) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const imagePath = resolve(DATA_DIR, mapEntry.folder, mapEntry.image);
    if (!imagePath.startsWith(DATA_DIR) || !existsSync(imagePath)) {
      return res.status(404).json({ error: 'Map image not found' });
    }

    res.sendFile(imagePath);
  } catch (err) {
    next(err);
  }
});

// GET /api/maps/:mapId/lineups — get lineups for a map, optional ?category= filter
app.get('/api/maps/:mapId/lineups', async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const { category } = req.query;

    const lineupsPath = resolve(DATA_DIR, mapId, 'lineups.json');
    if (!lineupsPath.startsWith(DATA_DIR) || !existsSync(lineupsPath)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const raw = await readFile(lineupsPath, 'utf-8');
    const data = JSON.parse(raw);

    if (category) {
      data.lineups = data.lineups.filter((l) => l.category === category);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/maps/:mapId/lineups/:folder/:filename — serve lineup asset files
app.get('/api/maps/:mapId/lineups/:folder/:filename', (req, res, next) => {
  try {
    const { mapId, folder, filename } = req.params;
    const filePath = resolve(DATA_DIR, mapId, 'lineups', folder, filename);

    if (!filePath.startsWith(DATA_DIR) || !existsSync(filePath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// POST /api/maps/:mapId/lineups — create a new lineup
app.post('/api/maps/:mapId/lineups', lineupUpload, async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const mapDir = resolve(DATA_DIR, mapId);
    if (!mapDir.startsWith(DATA_DIR) || !existsSync(mapDir)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const errors = validateLineupFields(req.body, req.files, true);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const { category, description, creator, landingX, landingY, startingX, startingY, startingDescription } = req.body;
    const folderName = makeFolderName(description, creator);
    const lineupDir = resolve(mapDir, 'lineups', folderName);
    await mkdir(lineupDir, { recursive: true });

    // Write asset files
    await writeFile(join(lineupDir, 'position.webp'), req.files.positionImage[0].buffer);
    await writeFile(join(lineupDir, 'lineup.webp'), req.files.lineupImage[0].buffer);
    await writeFile(join(lineupDir, 'video.webm'), req.files.video[0].buffer);

    const now = new Date().toISOString();
    const lineupEntry = {
      id: folderName,
      category,
      description: description.trim(),
      creator: creator.trim(),
      createdAt: now,
      updatedAt: now,
      landingPoint: { x: parseFloat(landingX), y: parseFloat(landingY) },
      startingPoints: [{
        id: 'sp1',
        position: { x: parseFloat(startingX), y: parseFloat(startingY) },
        description: startingDescription.trim(),
        creator: creator.trim(),
        folder: folderName,
      }],
    };

    // Write self-contained lineup.json inside the subfolder
    await writeJsonFile(join(lineupDir, 'lineup.json'), {
      ...lineupEntry,
      mapId,
      startingPoint: lineupEntry.startingPoints[0],
      assets: { position: 'position.webp', lineup: 'lineup.webp', video: 'video.webm' },
    });

    // Update the map's lineups.json index
    const lineupsPath = join(mapDir, 'lineups.json');
    const lineupsData = await readJsonFile(lineupsPath) || { mapId, lineups: [] };
    lineupsData.lineups.push(lineupEntry);
    await writeJsonFile(lineupsPath, lineupsData);

    res.status(201).json({ id: folderName, message: 'Lineup created successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/maps/:mapId/lineups/:lineupId — update an existing lineup
app.put('/api/maps/:mapId/lineups/:lineupId', lineupUpload, async (req, res, next) => {
  try {
    const { mapId, lineupId } = req.params;
    const mapDir = resolve(DATA_DIR, mapId);
    if (!mapDir.startsWith(DATA_DIR) || !existsSync(mapDir)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const lineupsPath = join(mapDir, 'lineups.json');
    const lineupsData = await readJsonFile(lineupsPath);
    if (!lineupsData) return res.status(404).json({ error: 'Map not found' });

    const idx = lineupsData.lineups.findIndex((l) => l.id === lineupId);
    if (idx === -1) return res.status(404).json({ error: 'Lineup not found' });

    const errors = validateLineupFields(req.body, req.files, false);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const lineup = lineupsData.lineups[idx];
    const { category, description, creator, landingX, landingY, startingX, startingY, startingDescription } = req.body;

    // Update fields if provided
    if (category) lineup.category = category;
    if (description) lineup.description = description.trim();
    if (creator) lineup.creator = creator.trim();
    if (landingX !== undefined) lineup.landingPoint.x = parseFloat(landingX);
    if (landingY !== undefined) lineup.landingPoint.y = parseFloat(landingY);
    if (startingX !== undefined && lineup.startingPoints[0]) lineup.startingPoints[0].position.x = parseFloat(startingX);
    if (startingY !== undefined && lineup.startingPoints[0]) lineup.startingPoints[0].position.y = parseFloat(startingY);
    if (startingDescription && lineup.startingPoints[0]) lineup.startingPoints[0].description = startingDescription.trim();
    if (creator && lineup.startingPoints[0]) lineup.startingPoints[0].creator = creator.trim();
    lineup.updatedAt = new Date().toISOString();

    // Update asset files if new ones were uploaded
    const oldDir = resolve(mapDir, 'lineups', lineupId);
    if (req.files?.positionImage?.[0]) await writeFile(join(oldDir, 'position.webp'), req.files.positionImage[0].buffer);
    if (req.files?.lineupImage?.[0]) await writeFile(join(oldDir, 'lineup.webp'), req.files.lineupImage[0].buffer);
    if (req.files?.video?.[0]) await writeFile(join(oldDir, 'video.webm'), req.files.video[0].buffer);

    // Rename folder if description or creator changed
    const newFolderName = makeFolderName(lineup.description, lineup.creator);
    const newDir = resolve(mapDir, 'lineups', newFolderName);
    if (newDir !== oldDir) {
      await rename(oldDir, newDir);
      lineup.id = newFolderName;
      if (lineup.startingPoints[0]) lineup.startingPoints[0].folder = newFolderName;
    }

    // Update self-contained lineup.json
    await writeJsonFile(join(newDir, 'lineup.json'), {
      ...lineup,
      mapId,
      startingPoint: lineup.startingPoints[0],
      assets: { position: 'position.webp', lineup: 'lineup.webp', video: 'video.webm' },
    });

    lineupsData.lineups[idx] = lineup;
    await writeJsonFile(lineupsPath, lineupsData);

    res.json({ id: lineup.id, message: 'Lineup updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/maps/:mapId/lineups/:lineupId/starting-points — add a starting point to an existing lineup
app.post('/api/maps/:mapId/lineups/:lineupId/starting-points', lineupUpload, async (req, res, next) => {
  try {
    const { mapId, lineupId } = req.params;
    const mapDir = resolve(DATA_DIR, mapId);
    if (!mapDir.startsWith(DATA_DIR) || !existsSync(mapDir)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const lineupsPath = join(mapDir, 'lineups.json');
    const lineupsData = await readJsonFile(lineupsPath);
    if (!lineupsData) return res.status(404).json({ error: 'Map not found' });

    const lineup = lineupsData.lineups.find((l) => l.id === lineupId);
    if (!lineup) return res.status(404).json({ error: 'Lineup not found' });

    // Validate required fields
    const errors = [];
    const { startingX, startingY, description, creator } = req.body;
    for (const c of ['startingX', 'startingY']) {
      const v = parseFloat(req.body[c]);
      if (isNaN(v) || v < 0 || v > 1) errors.push(`${c} must be a number between 0 and 1`);
    }
    if (!description?.trim()) errors.push('description is required');
    if (!creator?.trim()) errors.push('creator is required');
    if (!req.files?.positionImage?.[0]) errors.push('positionImage is required');
    if (!req.files?.lineupImage?.[0]) errors.push('lineupImage is required');
    if (!req.files?.video?.[0]) errors.push('video is required');
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    // Create new subfolder for this starting point
    const folderName = makeFolderName(description, creator);
    const spDir = resolve(mapDir, 'lineups', folderName);
    await mkdir(spDir, { recursive: true });

    // Write asset files
    await writeFile(join(spDir, 'position.webp'), req.files.positionImage[0].buffer);
    await writeFile(join(spDir, 'lineup.webp'), req.files.lineupImage[0].buffer);
    await writeFile(join(spDir, 'video.webm'), req.files.video[0].buffer);

    // Generate next starting point ID
    const maxSpNum = lineup.startingPoints.reduce((max, sp) => {
      const n = parseInt(sp.id.replace('sp', ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newSpId = `sp${maxSpNum + 1}`;

    const newSp = {
      id: newSpId,
      position: { x: parseFloat(startingX), y: parseFloat(startingY) },
      description: description.trim(),
      creator: creator.trim(),
      folder: folderName,
    };

    // Write self-contained lineup.json for this starting point's subfolder
    await writeJsonFile(join(spDir, 'lineup.json'), {
      id: lineup.id,
      mapId,
      category: lineup.category,
      description: lineup.description,
      creator: lineup.creator,
      createdAt: lineup.createdAt,
      updatedAt: new Date().toISOString(),
      landingPoint: lineup.landingPoint,
      startingPoint: newSp,
      assets: { position: 'position.webp', lineup: 'lineup.webp', video: 'video.webm' },
    });

    // Update lineups.json — add starting point to the lineup entry
    lineup.startingPoints.push(newSp);
    lineup.updatedAt = new Date().toISOString();
    await writeJsonFile(lineupsPath, lineupsData);

    res.status(201).json({ id: newSpId, folder: folderName, message: 'Starting point added successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/maps/:mapId/lineups/:lineupId — delete a lineup and its assets
app.delete('/api/maps/:mapId/lineups/:lineupId', async (req, res, next) => {
  try {
    const { mapId, lineupId } = req.params;
    const mapDir = resolve(DATA_DIR, mapId);
    if (!mapDir.startsWith(DATA_DIR) || !existsSync(mapDir)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const lineupsPath = join(mapDir, 'lineups.json');
    const lineupsData = await readJsonFile(lineupsPath);
    if (!lineupsData) return res.status(404).json({ error: 'Map not found' });

    const idx = lineupsData.lineups.findIndex((l) => l.id === lineupId);
    if (idx === -1) return res.status(404).json({ error: 'Lineup not found' });

    // Remove the lineup's asset folder
    const lineupDir = resolve(mapDir, 'lineups', lineupId);
    if (lineupDir.startsWith(DATA_DIR) && existsSync(lineupDir)) {
      await rm(lineupDir, { recursive: true });
    }

    // Remove from lineups.json
    lineupsData.lineups.splice(idx, 1);
    await writeJsonFile(lineupsPath, lineupsData);

    res.json({ message: 'Lineup deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/** Read all files in a lineup subfolder into a flat object { filename: Uint8Array } */
async function readFolderFiles(folderPath) {
  const files = {};
  if (!existsSync(folderPath)) return files;
  const entries = await readdir(folderPath);
  for (const entry of entries) {
    const filePath = join(folderPath, entry);
    files[entry] = new Uint8Array(await readFile(filePath));
  }
  return files;
}

/** Collect lineup folders for a map into a zip-ready structure: { mapName/folderName/file: data } */
async function collectLineupsForZip(mapId, lineupIds) {
  const mapDir = resolve(DATA_DIR, mapId);
  const lineupsPath = join(mapDir, 'lineups.json');
  const lineupsData = await readJsonFile(lineupsPath);
  if (!lineupsData) return {};

  const lineups = lineupIds === 'all'
    ? lineupsData.lineups
    : lineupsData.lineups.filter((l) => lineupIds.includes(l.id));

  const zipData = {};
  for (const lineup of lineups) {
    // Collect all starting point folders
    const folders = new Set();
    folders.add(lineup.id); // main lineup folder
    for (const sp of lineup.startingPoints) {
      if (sp.folder) folders.add(sp.folder);
    }
    for (const folder of folders) {
      const folderPath = resolve(mapDir, 'lineups', folder);
      const files = await readFolderFiles(folderPath);
      for (const [filename, data] of Object.entries(files)) {
        zipData[`${mapId}/${folder}/${filename}`] = data;
      }
    }
  }
  // Include the lineups.json with only the exported lineups
  const exportedLineupsData = {
    mapId,
    lineups: lineupIds === 'all'
      ? lineupsData.lineups
      : lineupsData.lineups.filter((l) => lineupIds.includes(l.id)),
  };
  zipData[`${mapId}/lineups.json`] = strToU8(JSON.stringify(exportedLineupsData, null, 2));
  return zipData;
}

/** Check if an imported starting point is a duplicate of any existing one */
function isDuplicate(existing, imported, tolerance) {
  for (const lineup of existing) {
    if (lineup.category !== imported.category) continue;
    if (Math.abs(lineup.landingPoint.x - imported.landingPoint.x) > tolerance) continue;
    if (Math.abs(lineup.landingPoint.y - imported.landingPoint.y) > tolerance) continue;
    for (const existSp of lineup.startingPoints) {
      for (const importSp of imported.startingPoints) {
        if (Math.abs(existSp.position.x - importSp.position.x) <= tolerance &&
            Math.abs(existSp.position.y - importSp.position.y) <= tolerance) {
          return true;
        }
      }
    }
  }
  return false;
}

// POST /api/maps/:mapId/export — export selected lineups as ZIP
app.post('/api/maps/:mapId/export', async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const { lineupIds } = req.body;

    if (!lineupIds) return res.status(400).json({ error: 'lineupIds is required (array or "all")' });

    const mapDir = resolve(DATA_DIR, mapId);
    if (!mapDir.startsWith(DATA_DIR) || !existsSync(mapDir)) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const zipData = await collectLineupsForZip(mapId, lineupIds);
    if (Object.keys(zipData).length === 0) {
      return res.status(404).json({ error: 'No lineups found to export' });
    }

    const zipped = zipSync(zipData);
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${mapId}-lineups.zip"`);
    res.send(Buffer.from(zipped));
  } catch (err) {
    next(err);
  }
});

// POST /api/export-all — export all lineups across all maps as ZIP
app.post('/api/export-all', async (_req, res, next) => {
  try {
    const mapsData = await readJsonFile(join(DATA_DIR, 'maps.json'));
    if (!mapsData?.maps?.length) return res.status(404).json({ error: 'No maps configured' });

    let zipData = {};
    for (const map of mapsData.maps) {
      const mapZip = await collectLineupsForZip(map.id, 'all');
      Object.assign(zipData, mapZip);
    }

    if (Object.keys(zipData).length === 0) {
      return res.status(404).json({ error: 'No lineups found to export' });
    }

    const zipped = zipSync(zipData);
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="cs2-lineups-all.zip"');
    res.send(Buffer.from(zipped));
  } catch (err) {
    next(err);
  }
});

// POST /api/import — import lineups from a ZIP file with duplicate detection
app.post('/api/import', zipUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'zipFile is required' });

    const unzipped = unzipSync(new Uint8Array(req.file.buffer));
    const fileNames = Object.keys(unzipped);

    // Group files by map/folder structure: mapId -> folder -> filename -> data
    const importMap = new Map(); // mapId -> { lineupsJson, folders: Map<folderName, Map<filename, data>> }
    for (const path of fileNames) {
      const parts = path.split('/');
      if (parts.length < 2) continue;
      const mapId = parts[0];
      if (!importMap.has(mapId)) importMap.set(mapId, { lineupsJson: null, folders: new Map() });
      const entry = importMap.get(mapId);

      if (parts.length === 2 && parts[1] === 'lineups.json') {
        entry.lineupsJson = JSON.parse(strFromU8(unzipped[path]));
      } else if (parts.length === 3) {
        const folder = parts[1];
        if (!entry.folders.has(folder)) entry.folders.set(folder, new Map());
        entry.folders.get(folder).set(parts[2], unzipped[path]);
      }
    }

    if (importMap.size === 0) {
      return res.status(400).json({ error: 'Invalid ZIP structure: no map folders found' });
    }

    // Get registered maps
    const mapsData = await readJsonFile(join(DATA_DIR, 'maps.json'));
    const registeredMapIds = new Set(mapsData?.maps?.map((m) => m.id) || []);

    const summary = { totalProcessed: 0, added: 0, ignored: 0, byMap: {} };
    const details = { added: [], ignored: [] };

    for (const [mapId, importEntry] of importMap) {
      if (!registeredMapIds.has(mapId)) {
        // Skip maps that don't exist in this installation
        continue;
      }

      const mapDir = resolve(DATA_DIR, mapId);
      const lineupsPath = join(mapDir, 'lineups.json');
      const existingData = await readJsonFile(lineupsPath) || { mapId, lineups: [] };
      summary.byMap[mapId] = { added: 0, ignored: 0 };

      if (!importEntry.lineupsJson?.lineups) continue;

      for (const lineup of importEntry.lineupsJson.lineups) {
        summary.totalProcessed++;

        if (isDuplicate(existingData.lineups, lineup, DUPLICATE_TOLERANCE)) {
          summary.ignored++;
          summary.byMap[mapId].ignored++;
          details.ignored.push({ map: mapId, description: lineup.description, reason: 'duplicate' });
          continue;
        }

        // Copy all starting point folders for this lineup
        const foldersToCopy = new Set();
        foldersToCopy.add(lineup.id);
        for (const sp of lineup.startingPoints) {
          if (sp.folder) foldersToCopy.add(sp.folder);
        }

        for (const folder of foldersToCopy) {
          const folderFiles = importEntry.folders.get(folder);
          if (!folderFiles) continue;
          const destDir = resolve(mapDir, 'lineups', folder);
          await mkdir(destDir, { recursive: true });
          for (const [filename, data] of folderFiles) {
            await writeFile(join(destDir, filename), data);
          }
        }

        // Add to lineups.json
        existingData.lineups.push(lineup);
        summary.added++;
        summary.byMap[mapId].added++;
        details.added.push({ map: mapId, description: lineup.description, id: lineup.id });
      }

      await writeJsonFile(lineupsPath, existingData);
    }

    res.json({ summary, details });
  } catch (err) {
    if (err.message?.includes('invalid')) {
      return res.status(400).json({ error: 'Invalid ZIP file' });
    }
    next(err);
  }
});

// --- Static frontend serving ---
app.use(express.static(DIST_DIR));

// SPA fallback — serve index.html for all non-API routes
app.get('/{*splat}', (_req, res) => {
  const indexPath = join(DIST_DIR, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run: npm run build' });
  }
});

// --- Error handling middleware ---
app.use((err, _req, res, _next) => {
  console.error(err.stack || err.message);
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again.',
  });
});

app.listen(PORT, () => {
  console.log(`CS2 Utility Lineup Guide running at http://localhost:${PORT}`);
});
