import { useState, useCallback } from 'react';

const MAX_STACK = 50;

export function useUndoRedo<T>(initial: T): {
  state: T;
  set: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
} {
  const [past, setPast] = useState<T[]>([]);
  const [current, setCurrent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((next: T) => {
    setPast((p) => [...p.slice(-MAX_STACK + 1), current]);
    setCurrent(next);
    setFuture([]);
  }, [current]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [current, ...f]);
    setCurrent(prev);
  }, [past, current]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, current]);
    setCurrent(next);
  }, [future, current]);

  return {
    state: current,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
