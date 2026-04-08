import { useState, useCallback } from 'react';
import { API_BASE } from '../constants';
import styles from './ExportDialog.module.css';

/**
 * ExportDialog shows lineup selection checkboxes, "Select All", "Export All Maps", and download trigger.
 *
 * Props:
 *   mapId   - Current map ID
 *   lineups - Array of lineup objects for the current map (all categories)
 *   onClose - () => void
 */
export default function ExportDialog({ mapId, lineups, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const allSelected = lineups.length > 0 && selected.size === lineups.length;

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(lineups.map((l) => l.id)));
    }
  }, [allSelected, lineups]);

  const downloadBlob = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportSelected = useCallback(async () => {
    if (selected.size === 0) { setError('Select at least one lineup'); return; }
    setError(null);
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/maps/${mapId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, `${mapId}-lineups.zip`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }, [selected, mapId, downloadBlob, onClose]);

  const handleExportAll = useCallback(async () => {
    setError(null);
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/export-all`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, 'cs2-lineups-all.zip');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }, [downloadBlob, onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Export Lineups</h3>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.list}>
          {lineups.length === 0 ? (
            <p className={styles.empty}>No lineups to export on this map.</p>
          ) : (
            <>
              <label className={styles.selectAll}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                Select All ({lineups.length})
              </label>
              {lineups.map((l) => (
                <label key={l.id} className={styles.item}>
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => toggleOne(l.id)}
                  />
                  <span className={styles.itemDesc}>{l.description}</span>
                  <span className={styles.itemMeta}>{l.category}</span>
                </label>
              ))}
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.exportBtn}
            onClick={handleExportSelected}
            disabled={exporting || selected.size === 0}
          >
            {exporting ? 'Exporting...' : `Export Selected (${selected.size})`}
          </button>
          <button
            className={styles.exportAllBtn}
            onClick={handleExportAll}
            disabled={exporting}
          >
            Export All Maps
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
