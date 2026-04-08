import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLineups, getAssetUrl } from '../services/api';
import styles from './DetailPage.module.css';

export default function DetailPage() {
  const { mapId, lineupId, startingPointId } = useParams();
  const [lineup, setLineup] = useState(null);
  const [startingPoint, setStartingPoint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLineups(mapId)
      .then((data) => {
        const found = data.lineups.find((l) => l.id === lineupId);
        if (!found) {
          setError('Lineup not found');
          return;
        }
        setLineup(found);
        const sp = found.startingPoints.find((s) => s.id === startingPointId);
        if (!sp) {
          setError('Starting point not found');
          return;
        }
        setStartingPoint(sp);
      })
      .catch((err) => setError(err.message));
  }, [mapId, lineupId, startingPointId]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link className={styles.backLink} to={`/map/${mapId}`}>
            &larr; Back to map
          </Link>
        </div>
        <div className={styles.errorBox}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            The lineup may have been deleted or the server may be unavailable.
          </p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lineup || !startingPoint) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Loading lineup details...</span>
        </div>
      </div>
    );
  }

  const videoUrl = getAssetUrl(mapId, startingPoint.folder, 'video.webm');
  const positionUrl = getAssetUrl(mapId, startingPoint.folder, 'position.webp');
  const lineupImgUrl = getAssetUrl(mapId, startingPoint.folder, 'lineup.webp');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link className={styles.backLink} to={`/map/${mapId}`}>
          &larr; Back to map
        </Link>
        <h1 className={styles.title}>{lineup.description}</h1>
      </div>

      <div className={styles.meta}>
        {lineup.category} &middot; by {startingPoint.creator} &middot;{' '}
        {startingPoint.description}
      </div>

      <div className={styles.videoSection}>
        <video
          className={styles.video}
          src={videoUrl}
          controls
          loop
          muted
          autoPlay
        />
      </div>

      <div className={styles.screenshotsRow}>
        <div className={styles.screenshotCard}>
          <div className={styles.screenshotLabel}>Starting Position</div>
          <img
            className={styles.screenshotImage}
            src={positionUrl}
            alt="Starting position"
          />
        </div>
        <div className={styles.screenshotCard}>
          <div className={styles.screenshotLabel}>Lineup Crosshair</div>
          <img
            className={styles.screenshotImage}
            src={lineupImgUrl}
            alt="Lineup crosshair"
          />
        </div>
      </div>
    </div>
  );
}
