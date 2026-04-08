import { CATEGORIES } from '../constants';
import styles from './CategoryPanel.module.css';

export default function CategoryPanel({ selected, onCategoryChange }) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Utility</h3>
      <div className={styles.buttons}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.button} ${selected === cat.id ? styles.active : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
