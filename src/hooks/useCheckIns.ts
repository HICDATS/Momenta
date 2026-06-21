import { useState, useEffect, useCallback } from 'react';
import type { CheckIn } from '../types';
import {
  addCheckIn as dbAddCheckIn,
  deleteCheckIn as dbDeleteCheckIn,
  getAllCheckIns,
} from '../db/database';

export interface UseCheckInsResult {
  checkIns: CheckIn[];
  loading: boolean;
  error: string | null;
  addCheckIn: (checkIn: Omit<CheckIn, 'id' | 'createdAt'>) => Promise<CheckIn | undefined>;
  deleteCheckIn: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCheckIns(): UseCheckInsResult {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const all = await getAllCheckIns();
      setCheckIns(all);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getAllCheckIns();
        if (!cancelled) {
          setCheckIns(all);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addCheckIn = useCallback(
    async (checkIn: Omit<CheckIn, 'id' | 'createdAt'>): Promise<CheckIn | undefined> => {
      try {
        const created = await dbAddCheckIn(checkIn);
        await refresh();
        return created;
      } catch (err) {
        setError((err as Error).message);
        return undefined;
      }
    },
    [refresh],
  );

  const deleteCheckIn = useCallback(
    async (id: string): Promise<void> => {
      try {
        await dbDeleteCheckIn(id);
        await refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [refresh],
  );

  return { checkIns, loading, error, addCheckIn, deleteCheckIn, refresh };
}
