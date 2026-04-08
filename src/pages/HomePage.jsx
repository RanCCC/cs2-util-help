import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMaps, getMapImageUrl } from '../services/api';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getMaps()
      .then((data) => setMaps(data.maps))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CS2 Utility Lineup Guide</h1>
      <p className={styles.subtitle}>Select a map to view utility lineups</p>

      {loading && (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <span>Loading maps...</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <p>Failed to load maps: {error}</p>
          <p className={styles.errorHint}>
            Make sure the server is running ({'"'}npm run dev:server{'"'}) and data/maps.json exists.
          </p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && maps.length === 0 && (
        <div className={styles.emptyBox}>
          <p>No maps configured yet.</p>
          <p className={styles.emptyHint}>
            Add map entries to data/maps.json and place map images in data/&lt;mapId&gt;/ folders.
          </p>
        </div>
      )}

      {!loading && !error && maps.length > 0 && (
        <div className={styles.grid}>
          {maps.map((map) => (
            <div
              key={map.id}
              className={styles.card}
              onClick={() => navigate(`/map/${map.id}`)}
            >
              <img
                className={styles.cardImage}
                src={getMapImageUrl(map.id)}
                alt={map.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className={styles.cardName}>{map.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
