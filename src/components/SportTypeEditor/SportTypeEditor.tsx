import { useState, useCallback } from 'react';
import {
  Dumbbell,
  Footprints,
  Waves,
  Flower,
  Bike,
  Circle,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { useSportTypes } from '../../hooks/useSportTypes';
import styles from './SportTypeEditor.module.css';

const AVAILABLE_ICONS = [
  'Dumbbell', 'Footprints', 'Waves', 'Flower', 'Bike', 'Circle', 'Sparkles', 'Zap',
];
const AVAILABLE_COLORS = [
  '#FF6B6B', '#FF9F43', '#00B894', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#55EFC4',
];

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Footprints, Waves, Flower, Bike, Circle, Sparkles, Zap,
};

const MAX_NAME_LENGTH = 10;
const DEFAULT_ICON = 'Dumbbell';
const DEFAULT_COLOR = '#FF6B6B';
const NAME_PLACEHOLDER = '如：攀岩';
const TITLE = '添加运动类型';
const ERROR_EMPTY = '请输入运动名称';
const ERROR_TOO_LONG = `名称不能超过${MAX_NAME_LENGTH}字`;
const ERROR_DUPLICATE = '该名称已存在';

interface SportTypeEditorProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SportTypeEditor({
  open,
  onClose,
  onSaved,
}: SportTypeEditorProps): JSX.Element | null {
  const { sportTypes, addSportType } = useSportTypes();
  const [name, setName] = useState<string>('');
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback((): void => {
    setName('');
    setIcon(DEFAULT_ICON);
    setColor(DEFAULT_COLOR);
    setError(null);
  }, []);

  const handleClose = useCallback((): void => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback((): void => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(ERROR_EMPTY);
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(ERROR_TOO_LONG);
      return;
    }
    if (sportTypes.some((s) => s.name === trimmed)) {
      setError(ERROR_DUPLICATE);
      return;
    }
    const created = addSportType({ name: trimmed, icon, color });
    if (!created) {
      setError(ERROR_TOO_LONG);
      return;
    }
    resetForm();
    onSaved();
  }, [name, icon, color, sportTypes, addSportType, resetForm, onSaved]);

  const handleNameChange = (value: string): void => {
    setName(value);
    if (error) setError(null);
  };

  return (
    <Modal open={open} onClose={handleClose} title={TITLE}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sport-type-name">运动名称</label>
          <input
            id="sport-type-name"
            className={styles.nameInput}
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={NAME_PLACEHOLDER}
            onChange={(e) => handleNameChange(e.target.value)}
            aria-invalid={error !== null}
          />
          <div className={styles.nameCounter}>{name.length}/{MAX_NAME_LENGTH}</div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.field}>
          <span className={styles.label}>图标</span>
          <div className={styles.iconGrid}>
            {AVAILABLE_ICONS.map((iconName) => {
              const Icon = ICON_MAP[iconName];
              const isSelected = icon === iconName;
              const cls = isSelected
                ? `${styles.iconOption} ${styles.iconSelected}`
                : styles.iconOption;
              return (
                <button
                  key={iconName}
                  type="button"
                  className={cls}
                  onClick={() => setIcon(iconName)}
                  aria-label={`选择图标${iconName}`}
                  aria-pressed={isSelected}
                >
                  <Icon className={styles.iconImage} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>颜色</span>
          <div className={styles.colorGrid}>
            {AVAILABLE_COLORS.map((colorValue) => {
              const isSelected = color === colorValue;
              const cls = isSelected
                ? `${styles.colorOption} ${styles.colorSelected}`
                : styles.colorOption;
              return (
                <button
                  key={colorValue}
                  type="button"
                  className={cls}
                  style={{ backgroundColor: colorValue }}
                  onClick={() => setColor(colorValue)}
                  aria-label={`选择颜色${colorValue}`}
                  aria-pressed={isSelected}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={handleClose}>取消</button>
          <button type="button" className={styles.saveButton} onClick={handleSave}>保存</button>
        </div>
      </div>
    </Modal>
  );
}
