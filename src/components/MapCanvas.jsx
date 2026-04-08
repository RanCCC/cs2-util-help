import { useRef, useCallback } from 'react';
import styles from './MapCanvas.module.css';

/**
 * MapCanvas renders a map image with interactive markers and dotted lines.
 *
 * Props:
 *   mapImageUrl    - URL of the map image
 *   landingPoints  - Array of { id, x, y } (normalized 0–1)
 *   startingPoints - Array of { id, x, y, landingX, landingY, folder } (visible starting points)
 *   onLandingClick - (landingPoint) => void
 *   onStartingHover  - (startingPoint, rect) => void | null to clear
 *   onStartingClick  - (startingPoint) => void
 *   onEmptyClick     - () => void
 */
export default function MapCanvas({
  mapImageUrl,
  landingPoints = [],
  startingPoints = [],
  onLandingClick,
  onStartingHover,
  onStartingClick,
  onEmptyClick,
  reportClickCoords = false,
}) {
  const containerRef = useRef(null);

  const handleContainerClick = useCallback(
    (e) => {
      // Only fire if clicking directly on the container or the image/svg (not a marker)
      if (
        e.target === containerRef.current ||
        e.target.tagName === 'IMG' ||
        e.target.tagName === 'svg'
      ) {
        if (reportClickCoords && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          onEmptyClick?.({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
        } else {
          onEmptyClick?.();
        }
      }
    },
    [onEmptyClick, reportClickCoords]
  );

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <img
        className={styles.mapImage}
        src={mapImageUrl}
        alt="Map"
        draggable={false}
      />

      {/* Dotted lines between landing and starting points */}
      <svg className={styles.svgOverlay}>
        {startingPoints.map((sp) => (
          <line
            key={`line-${sp.id}`}
            x1={`${sp.landingX * 100}%`}
            y1={`${sp.landingY * 100}%`}
            x2={`${sp.x * 100}%`}
            y2={`${sp.y * 100}%`}
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
          />
        ))}
      </svg>

      {/* Landing point markers */}
      {landingPoints.map((lp) => (
        <div
          key={`lp-${lp.id}`}
          className={`${styles.marker} ${styles.landingMarker}`}
          style={{ left: `${lp.x * 100}%`, top: `${lp.y * 100}%` }}
          onClick={(e) => {
            e.stopPropagation();
            onLandingClick?.(lp);
          }}
        />
      ))}

      {/* Starting point markers */}
      {startingPoints.map((sp) => (
        <div
          key={`sp-${sp.id}`}
          className={`${styles.marker} ${styles.startingMarker}`}
          style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%` }}
          onClick={(e) => {
            e.stopPropagation();
            onStartingClick?.(sp);
          }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onStartingHover?.(sp, rect);
          }}
          onMouseLeave={() => {
            onStartingHover?.(null, null);
          }}
        />
      ))}
    </div>
  );
}
