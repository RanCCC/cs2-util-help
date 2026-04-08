import { useState, useCallback, useRef } from 'react';
import { importLineups } from '../services/api';
import styles from './ImportDialog.module.css';

/**
 * ImportDialog allows uploading a ZIP file, triggers import, and shows result summary.
 *
 * Props:
 *   onClose   - () => void
 *   onImported - () => void — called after successful import so parent can reload data
 */
export default function ImportDialog({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.zip')) {
      setError('Please select a .zip file');
      return;
    }
    setError(null);
    setSummary(null);
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      const result = await importLineups(file);
      setSummary(result.summary);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }, [file, onImported]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Import Lineups</h3>

        {error && <div className={styles.error}>{error}</div>}

        {!summary && (
          <>
            {!file ? (
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                Drop a ZIP file here or click to browse
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip"
                  className={styles.fileInput}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>
            ) : (
              <div className={styles.selectedFile}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                <button
                  className={styles.removeFile}
                  onClick={handleRemoveFile}
                  title="Remove file"
                >
                  &times;
                </button>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.importBtn}
                onClick={handleImport}
                disabled={importing || !file}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {summary && (
          <>
            <div className={styles.summaryHeader}>
              <div className={`${styles.statBox} ${styles.statAdded}`}>
                <span className={styles.statValue}>{summary.added}</span>
                <span className={styles.statLabel}>Added</span>
              </div>
              <div className={`${styles.statBox} ${styles.statIgnored}`}>
                <span className={styles.statValue}>{summary.ignored}</span>
                <span className={styles.statLabel}>Ignored</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{summary.totalProcessed}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </div>

            {summary.byMap && Object.keys(summary.byMap).length > 0 && (
              <div className={styles.mapBreakdown}>
                {Object.entries(summary.byMap).map(([mapName, stats]) => (
                  <div key={mapName} className={styles.mapRow}>
                    <span className={styles.mapName}>{mapName}</span>
                    <span className={`${styles.mapStat} ${styles.mapStatAdded}`}>
                      +{stats.added}
                    </span>
                    <span className={`${styles.mapStat} ${styles.mapStatIgnored}`}>
                      ~{stats.ignored}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.doneBtn} onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
