import { useMemo } from 'react';
import { OVERLAY_MIN_SIZE_FRACTION } from '../constants';
import styles from './MarkerOverlay.module.css';

/**
 * MarkerOverlay displays a lineup screenshot preview near a starting-point marker.
 *
 * Props:
 *   imageUrl  - URL of the lineup screenshot
 *   markerRect - DOMRect of the marker element (from getBoundingClientRect)
 */
export default function MarkerOverlay({ imageUrl, markerRect }) {
  const style = useMemo(() => {
    if (!markerRect) return {};

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = Math.max(vw, vh) * OVERLAY_MIN_SIZE_FRACTION;

    // Position: prefer to the right of the marker, fall back to left
    let left = markerRect.right + 12;
    if (left + size > vw) {
      left = markerRect.left - size - 12;
    }
    // Clamp horizontal
    left = Math.max(8, Math.min(left, vw - size - 8));

    // Vertical: center on marker, clamp to viewport
    let top = markerRect.top + markerRect.height / 2 - size / 2;
    top = Math.max(8, Math.min(top, vh - size - 8));

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${size}px`,
    };
  }, [markerRect]);

  if (!imageUrl || !markerRect) return null;

  return (
    <div className={styles.overlay} style={style}>
      <img className={styles.image} src={imageUrl} alt="Lineup preview" />
    </div>
  );
}
