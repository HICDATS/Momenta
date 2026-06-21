import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_SPORT_TYPES } from '../constants/sports';
import type { SportType } from '../types';

const STORAGE_KEY = 'momenta-custom-sports';
const MAX_NAME_LENGTH = 10;
const CUSTOM_ID_PREFIX = 'custom-';
const ORDER_STEP = 1;

export interface UseSportTypesResult {
  sportTypes: SportType[];
  customSportTypes: SportType[];
  addSportType: (
    sportType: Omit<SportType, 'id' | 'isDefault' | 'order'>,
  ) => SportType | null;
  updateSportType: (id: string, updates: Partial<SportType>) => void;
  deleteSportType: (id: string) => boolean;
}

function isValidName(name: string): boolean {
  return name.length > 0 && name.length <= MAX_NAME_LENGTH;
}

function getNextOrder(customTypes: SportType[]): number {
  const allOrders = [
    ...DEFAULT_SPORT_TYPES.map((s) => s.order),
    ...customTypes.map((s) => s.order),
  ];
  const maxOrder = allOrders.length > 0 ? Math.max(...allOrders) : 0;
  return maxOrder + ORDER_STEP;
}

export function useSportTypes(): UseSportTypesResult {
  const [customTypes, setCustomTypes] = useLocalStorage<SportType[]>(
    STORAGE_KEY,
    [],
  );

  const sportTypes = useMemo<SportType[]>(() => {
    return [...DEFAULT_SPORT_TYPES, ...customTypes].sort(
      (a, b) => a.order - b.order,
    );
  }, [customTypes]);

  const addSportType = useCallback(
    (sportType: Omit<SportType, 'id' | 'isDefault' | 'order'>): SportType | null => {
      if (!isValidName(sportType.name)) return null;
      const newType: SportType = {
        ...sportType,
        id: `${CUSTOM_ID_PREFIX}${crypto.randomUUID()}`,
        isDefault: false,
        order: getNextOrder(customTypes),
      };
      setCustomTypes([...customTypes, newType]);
      return newType;
    },
    [customTypes, setCustomTypes],
  );

  const updateSportType = useCallback(
    (id: string, updates: Partial<SportType>): void => {
      const target = customTypes.find((s) => s.id === id);
      if (!target) return;
      if (target.isDefault) return;
      setCustomTypes(
        customTypes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [customTypes, setCustomTypes],
  );

  const deleteSportType = useCallback(
    (id: string): boolean => {
      const target = customTypes.find((s) => s.id === id);
      if (!target) return false;
      if (target.isDefault) return false;
      setCustomTypes(customTypes.filter((s) => s.id !== id));
      return true;
    },
    [customTypes, setCustomTypes],
  );

  return {
    sportTypes,
    customSportTypes: customTypes,
    addSportType,
    updateSportType,
    deleteSportType,
  };
}
