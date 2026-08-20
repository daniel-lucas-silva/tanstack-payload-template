import { useState, useEffect, useCallback } from 'react';
import { syncEngine, type SyncEngineState } from './engine';

export function useSync() {
  const [state, setState] = useState<SyncEngineState>(() => syncEngine.getState());

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const syncNow = useCallback(async () => {
    return await syncEngine.syncAll();
  }, []);

  const clearQueue = useCallback(async () => {
    await syncEngine.clearQueue();
  }, []);

  return {
    ...state,
    syncNow,
    clearQueue,
  };
}
