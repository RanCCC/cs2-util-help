import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLineups, getMapImageUrl, getAssetUrl, deleteLineup } from '../services/api';
import { DEFAULT_CATEGORY } from '../constants';
import MapCanvas from '../components/MapCanvas';
import MarkerOverlay from '../components/MarkerOverlay';
import CategoryPanel from '../components/CategoryPanel';
import LineupForm from '../components/LineupForm';
import ExportDialog from '../components/ExportDialog';
import ImportDialog from '../components/ImportDialog';
import styles from './MapPage.module.css';

export default function MapPage() {
  const { mapId } = useParams();
  const navigate = useNavigate();

  const [lineups, setLineups] = useState([]);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [selectedLandingId, setSelectedLandingId] = useState(null);
  const [hoveredSp, setHoveredSp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingLineup, setEditingLineup] = useState(null); // lineup being edited, or null for new
  const [showForm, setShowForm] = useState(false);
  const [placementMode, setPlacementMode] = useState(null); // 'landing' | 'starting' | null
  const [formLandingPoint, setFormLandingPoint] = useState(null);
  const [formStartingPoint, setFormStartingPoint] = useState(null);
  const [addToLineupId, setAddToLineupId] = useState(null); // lineup ID when adding a starting point

  // Export/Import dialog state
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [allLineups, setAllLineups] = useState([]); // unfiltered lineups for export

  // Reset state when map changes
  useEffect(() => {
    setSelectedLandingId(null);
    setHoveredSp(null);
    setCategory(DEFAULT_CATEGORY);
    setEditMode(false);
    resetForm();
  }, [mapId]);

  const fetchLineups = useCallback(() => {
    setError(null);
    setLoading(true);
    getLineups(mapId, category)
      .then((data) => setLineups(data.lineups))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mapId, category]);

  useEffect(() => {
    fetchLineups();
  }, [fetchLineups]);

  function resetForm() {
    setShowForm(false);
    setEditingLineup(null);
    setPlacementMode(null);
    setFormLandingPoint(null);
    setFormStartingPoint(null);
    setAddToLineupId(null);
  }

  // Build unique landing points from lineups
  const landingPoints = useMemo(() => {
    const seen = new Map();
    for (const lineup of lineups) {
      const key = `${lineup.landingPoint.x},${lineup.landingPoint.y}`;
      if (!seen.has(key)) {
        seen.set(key, {
          id: key,
          x: lineup.landingPoint.x,
          y: lineup.landingPoint.y,
          lineupIds: [],
        });
      }
      seen.get(key).lineupIds.push(lineup.id);
    }
    return Array.from(seen.values());
  }, [lineups]);

  // Build starting points for the selected landing point
  const visibleStartingPoints = useMemo(() => {
    if (!selectedLandingId) return [];
    const lp = landingPoints.find((p) => p.id === selectedLandingId);
    if (!lp) return [];

    const points = [];
    for (const lineup of lineups) {
      if (!lp.lineupIds.includes(lineup.id)) continue;
      for (const sp of lineup.startingPoints) {
        points.push({
          id: `${lineup.id}__${sp.id}`,
          x: sp.position.x,
          y: sp.position.y,
          landingX: lineup.landingPoint.x,
          landingY: lineup.landingPoint.y,
          folder: sp.folder,
          lineupId: lineup.id,
          startingPointId: sp.id,
        });
      }
    }
    return points;
  }, [selectedLandingId, landingPoints, lineups]);

  // Build preview markers for form point placement
  const formPreviewPoints = useMemo(() => {
    const points = { landing: [], starting: [] };
    if (!showForm) return points;
    if (formLandingPoint) {
      points.landing.push({ id: 'form-landing', x: formLandingPoint.x, y: formLandingPoint.y, lineupIds: [] });
    }
    if (formStartingPoint && formLandingPoint) {
      points.starting.push({
        id: 'form-starting',
        x: formStartingPoint.x,
        y: formStartingPoint.y,
        landingX: formLandingPoint.x,
        landingY: formLandingPoint.y,
        folder: '',
        lineupId: '',
        startingPointId: '',
      });
    }
    return points;
  }, [showForm, formLandingPoint, formStartingPoint]);

  // Merge real markers with form preview markers
  const displayLandingPoints = showForm
    ? [...landingPoints, ...formPreviewPoints.landing]
    : landingPoints;
  const displayStartingPoints = showForm
    ? [...visibleStartingPoints, ...formPreviewPoints.starting]
    : visibleStartingPoints;

  const handleCategoryChange = useCallback((newCategory) => {
    setCategory(newCategory);
    setSelectedLandingId(null);
    setHoveredSp(null);
  }, []);

  const handleLandingClick = useCallback((lp) => {
    if (editMode && !showForm) {
      // In edit mode without form open: select landing to see its lineups for edit/delete
      setSelectedLandingId((prev) => (prev === lp.id ? null : lp.id));
      setHoveredSp(null);
      return;
    }
    if (!editMode) {
      setSelectedLandingId((prev) => (prev === lp.id ? null : lp.id));
      setHoveredSp(null);
    }
  }, [editMode, showForm]);

  const handleEmptyClick = useCallback((coords) => {
    // If in placement mode, place the point at click coordinates
    if (showForm && placementMode && coords) {
      if (placementMode === 'landing') {
        setFormLandingPoint({ x: coords.x, y: coords.y });
      } else if (placementMode === 'starting') {
        setFormStartingPoint({ x: coords.x, y: coords.y });
      }
      setPlacementMode(null);
      return;
    }

    setSelectedLandingId(null);
    setHoveredSp(null);
  }, [showForm, placementMode]);

  const handleStartingHover = useCallback((sp, rect) => {
    if (!sp) { setHoveredSp(null); return; }
    setHoveredSp({ sp, rect });
  }, []);

  const handleStartingClick = useCallback((sp) => {
    if (editMode && !showForm) {
      // In edit mode: open form pre-filled with this lineup's data
      const lineup = lineups.find((l) => l.id === sp.lineupId);
      if (lineup) {
        setEditingLineup(lineup);
        setFormLandingPoint(lineup.landingPoint);
        setFormStartingPoint(lineup.startingPoints[0]?.position || null);
        setShowForm(true);
      }
      return;
    }
    if (!editMode) {
      const url = `/map/${mapId}/lineup/${sp.lineupId}/${sp.startingPointId}`;
      window.open(url, '_blank');
    }
  }, [editMode, showForm, mapId, lineups]);

  const handleToggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      if (prev) {
        // Switching to View mode — reload data, clear form
        resetForm();
        setSelectedLandingId(null);
        setHoveredSp(null);
      }
      return !prev;
    });
  }, []);

  const handleNewLineup = useCallback(() => {
    setEditingLineup(null);
    setFormLandingPoint(null);
    setFormStartingPoint(null);
    setShowForm(true);
    setSelectedLandingId(null);
  }, []);

  const handleFormSave = useCallback(() => {
    resetForm();
    fetchLineups();
  }, [fetchLineups]);

  const handleFormCancel = useCallback(() => {
    resetForm();
  }, []);

  const handleRequestPlace = useCallback((type) => {
    setPlacementMode(type);
  }, []);

  const handleAddStartingPoint = useCallback((lineupId) => {
    const lineup = lineups.find((l) => l.id === lineupId);
    if (!lineup) return;
    setAddToLineupId(lineupId);
    setFormLandingPoint(lineup.landingPoint); // show landing point on map for reference
    setFormStartingPoint(null);
    setEditingLineup(null);
    setShowForm(true);
  }, [lineups]);

  const handleOpenExport = useCallback(() => {
    getLineups(mapId)
      .then((data) => {
        setAllLineups(data.lineups);
        setShowExport(true);
      })
      .catch((err) => setError(err.message));
  }, [mapId]);

  const handleDeleteLineup = useCallback(async (lineupId) => {
    if (!confirm('Delete this lineup? This cannot be undone.')) return;
    try {
      await deleteLineup(mapId, lineupId);
      setSelectedLandingId(null);
      fetchLineups();
    } catch (err) {
      setError(err.message);
    }
  }, [mapId, fetchLineups]);

  // Overlay image URL
  const overlayImageUrl = hoveredSp
    ? getAssetUrl(mapId, hoveredSp.sp.folder, 'lineup.webp')
    : null;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            &larr; Back
          </button>
          <span className={styles.mapName}>{mapId}</span>
        </div>
        <div className={styles.errorBox}>
          <p>Failed to load lineups: {error}</p>
          <p className={styles.errorHint}>
            Check that the server is running and data/{mapId}/lineups.json exists.
          </p>
          <button className={styles.retryBtn} onClick={fetchLineups}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          &larr; Back
        </button>
        <span className={styles.mapName}>{mapId}</span>
        <div className={styles.headerRight}>
          <button
            className={`${styles.modeToggle} ${editMode ? styles.editActive : ''}`}
            onClick={handleToggleEditMode}
          >
            {editMode ? 'View Mode' : 'Edit Mode'}
          </button>
          {editMode && !showForm && (
            <button className={styles.newBtn} onClick={handleNewLineup}>
              + New Lineup
            </button>
          )}
          {!editMode && (
            <>
              <button className={styles.exportBtn} onClick={handleOpenExport}>
                Export
              </button>
              <button className={styles.importBtn} onClick={() => setShowImport(true)}>
                Import
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {showForm ? (
          <LineupForm
            mapId={mapId}
            category={category}
            landingPoint={formLandingPoint}
            startingPoint={formStartingPoint}
            editData={editingLineup}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            placementMode={placementMode}
            onRequestPlace={handleRequestPlace}
            addToLineupId={addToLineupId}
          />
        ) : (
          <CategoryPanel selected={category} onCategoryChange={handleCategoryChange} />
        )}
        <div className={styles.mapArea}>
          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <span>Loading lineups...</span>
            </div>
          )}
          <MapCanvas
            mapImageUrl={getMapImageUrl(mapId)}
            landingPoints={displayLandingPoints}
            startingPoints={displayStartingPoints}
            onLandingClick={handleLandingClick}
            onStartingHover={editMode ? undefined : handleStartingHover}
            onStartingClick={handleStartingClick}
            onEmptyClick={handleEmptyClick}
            reportClickCoords={showForm && !!placementMode}
          />
          {!loading && lineups.length === 0 && !showForm && (
            <div className={styles.emptyState}>
              No lineups found for this category.
              {editMode
                ? ' Click "+ New Lineup" to create one.'
                : ' Try switching categories or add lineups in Edit mode.'}
            </div>
          )}
          {/* Edit mode: show edit/delete buttons on visible starting points */}
          {editMode && !showForm && visibleStartingPoints.length > 0 && (
            <div className={styles.editActions}>
              {/* Show one row per unique lineup in the selected landing point */}
              {(() => {
                const seen = new Set();
                return visibleStartingPoints.filter((sp) => {
                  if (seen.has(sp.lineupId)) return false;
                  seen.add(sp.lineupId);
                  return true;
                }).map((sp) => {
                  const lineup = lineups.find((l) => l.id === sp.lineupId);
                  if (!lineup) return null;
                  return (
                    <div key={sp.lineupId} className={styles.editActionRow}>
                      <span className={styles.editLabel}>
                        {lineup.description} ({lineup.startingPoints.length} SP)
                      </span>
                      <button
                        className={styles.addSpBtn}
                        onClick={() => handleAddStartingPoint(lineup.id)}
                      >
                        + SP
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingLineup(lineup);
                          setFormLandingPoint(lineup.landingPoint);
                          setFormStartingPoint(lineup.startingPoints[0]?.position || null);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteLineup(lineup.id)}
                      >
                        Delete
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      <MarkerOverlay
        imageUrl={overlayImageUrl}
        markerRect={hoveredSp?.rect ?? null}
      />

      {showExport && (
        <ExportDialog
          mapId={mapId}
          lineups={allLineups}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImported={fetchLineups}
        />
      )}
    </div>
  );
}
