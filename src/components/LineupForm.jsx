import { useState, useCallback } from 'react';
import { CATEGORIES, ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES, MAX_DESCRIPTION_LENGTH, MAX_CREATOR_LENGTH } from '../constants';
import { createLineup, updateLineup, addStartingPoint } from '../services/api';
import { compressImage, compressVideo } from '../services/compression';
import styles from './LineupForm.module.css';

/**
 * LineupForm handles creating and editing lineups.
 *
 * Props:
 *   mapId           - Current map ID
 *   category        - Active category
 *   landingPoint    - { x, y } placed on map (null if not placed)
 *   startingPoint   - { x, y } placed on map (null if not placed)
 *   editData        - Existing lineup data when editing (null for create)
 *   onSave          - () => void — called after successful save
 *   onCancel        - () => void
 *   placementMode   - 'landing' | 'starting' | null — what the next map click places
 *   onRequestPlace  - (type: 'landing' | 'starting') => void — request map click placement
 *   addToLineupId   - If set, form is in "Add Starting Point" mode (adds SP to existing lineup)
 */
export default function LineupForm({
  mapId,
  category,
  landingPoint,
  startingPoint,
  editData,
  onSave,
  onCancel,
  placementMode,
  onRequestPlace,
  addToLineupId,
}) {
  const isEdit = !!editData;
  const isAddSp = !!addToLineupId;

  const [description, setDescription] = useState(editData?.description || '');
  const [creator, setCreator] = useState(editData?.creator || '');
  const [startingDescription, setStartingDescription] = useState(
    editData?.startingPoints?.[0]?.description || ''
  );
  const [positionImage, setPositionImage] = useState(null);
  const [lineupImage, setLineupImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback((setter, acceptedTypes) => (e) => {
    const file = e.target.files?.[0];
    if (file && !acceptedTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.type}`);
      return;
    }
    setError(null);
    setter(file || null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (isAddSp) {
      if (!startingPoint) { setError('Place a starting point on the map'); return; }
      if (!positionImage || !lineupImage || !video) { setError('All three media files are required'); return; }
    } else if (!isEdit) {
      if (!landingPoint) { setError('Place a landing point on the map'); return; }
      if (!startingPoint) { setError('Place a starting point on the map'); return; }
      if (!positionImage || !lineupImage || !video) { setError('All three media files are required'); return; }
    }

    try {
      // Compress media files
      setCompressing(true);
      let compressedPosition = positionImage;
      let compressedLineup = lineupImage;
      let compressedVideo = video;

      if (positionImage) compressedPosition = await compressImage(positionImage);
      if (lineupImage) compressedLineup = await compressImage(lineupImage);
      if (video) compressedVideo = await compressVideo(video);
      setCompressing(false);

      setSaving(true);
      const formData = new FormData();

      if (isAddSp) {
        // Add Starting Point mode — only starting point fields
        formData.append('startingX', startingPoint.x.toString());
        formData.append('startingY', startingPoint.y.toString());
        formData.append('description', startingDescription.trim());
        formData.append('creator', creator.trim());
      } else if (isEdit) {
        if (description !== editData.description) formData.append('description', description.trim());
        if (creator !== editData.creator) formData.append('creator', creator.trim());
        if (landingPoint) {
          formData.append('landingX', landingPoint.x.toString());
          formData.append('landingY', landingPoint.y.toString());
        }
        if (startingPoint) {
          formData.append('startingX', startingPoint.x.toString());
          formData.append('startingY', startingPoint.y.toString());
        }
        formData.append('startingDescription', startingDescription.trim());
      } else {
        formData.append('description', description.trim());
        formData.append('creator', creator.trim());
        formData.append('category', category);
        formData.append('landingX', landingPoint.x.toString());
        formData.append('landingY', landingPoint.y.toString());
        formData.append('startingX', startingPoint.x.toString());
        formData.append('startingY', startingPoint.y.toString());
        formData.append('startingDescription', startingDescription.trim());
      }

      if (compressedPosition) formData.append('positionImage', compressedPosition);
      if (compressedLineup) formData.append('lineupImage', compressedLineup);
      if (compressedVideo) formData.append('video', compressedVideo);

      if (isAddSp) {
        await addStartingPoint(mapId, addToLineupId, formData);
      } else if (isEdit) {
        await updateLineup(mapId, editData.id, formData);
      } else {
        await createLineup(mapId, formData);
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setCompressing(false);
    }
  }, [isEdit, isAddSp, addToLineupId, editData, mapId, category, description, creator, startingDescription, landingPoint, startingPoint, positionImage, lineupImage, video, onSave]);

  const imageAccept = ACCEPTED_IMAGE_TYPES.join(',');
  const videoAccept = ACCEPTED_VIDEO_TYPES.join(',');

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>
        {isAddSp ? 'Add Starting Point' : isEdit ? 'Edit Lineup' : 'New Lineup'}
      </h3>

      {error && <div className={styles.error}>{error}</div>}

      {!isAddSp && (
        <>
          <div className={styles.section}>
            <label className={styles.label}>Category</label>
            <span className={styles.value}>
              {CATEGORIES.find((c) => c.id === category)?.name || category}
            </span>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="e.g. A site smoke from long doors"
              required
            />
          </div>
        </>
      )}

      <div className={styles.section}>
        <label className={styles.label}>Creator</label>
        <input
          className={styles.input}
          type="text"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          maxLength={MAX_CREATOR_LENGTH}
          placeholder="Your name"
          required
        />
      </div>

      {!isAddSp && (
      <div className={styles.section}>
        <label className={styles.label}>Landing Point</label>
        <div className={styles.pointRow}>
          {landingPoint ? (
            <span className={styles.coords}>
              ({landingPoint.x.toFixed(3)}, {landingPoint.y.toFixed(3)})
            </span>
          ) : (
            <span className={styles.placeholder}>Not placed</span>
          )}
          <button
            type="button"
            className={`${styles.placeBtn} ${placementMode === 'landing' ? styles.placing : ''}`}
            onClick={() => onRequestPlace('landing')}
          >
            {placementMode === 'landing' ? 'Click map...' : 'Place'}
          </button>
        </div>
      </div>
      )}

      <div className={styles.section}>
        <label className={styles.label}>Starting Point</label>
        <div className={styles.pointRow}>
          {startingPoint ? (
            <span className={styles.coords}>
              ({startingPoint.x.toFixed(3)}, {startingPoint.y.toFixed(3)})
            </span>
          ) : (
            <span className={styles.placeholder}>Not placed</span>
          )}
          <button
            type="button"
            className={`${styles.placeBtn} ${placementMode === 'starting' ? styles.placing : ''}`}
            onClick={() => onRequestPlace('starting')}
          >
            {placementMode === 'starting' ? 'Click map...' : 'Place'}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Starting Point Description</label>
        <input
          className={styles.input}
          type="text"
          value={startingDescription}
          onChange={(e) => setStartingDescription(e.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="e.g. From long doors corner"
          required
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          Position Screenshot {isEdit && '(optional)'}
        </label>
        <input
          type="file"
          accept={imageAccept}
          onChange={handleFileChange(setPositionImage, ACCEPTED_IMAGE_TYPES)}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          Lineup Screenshot {isEdit && '(optional)'}
        </label>
        <input
          type="file"
          accept={imageAccept}
          onChange={handleFileChange(setLineupImage, ACCEPTED_IMAGE_TYPES)}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          Video Recording {isEdit && '(optional)'}
        </label>
        <input
          type="file"
          accept={videoAccept}
          onChange={handleFileChange(setVideo, ACCEPTED_VIDEO_TYPES)}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.saveBtn}
          disabled={saving || compressing}
        >
          {compressing ? 'Compressing...' : saving ? 'Saving...' : isAddSp ? 'Add' : isEdit ? 'Update' : 'Create'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
