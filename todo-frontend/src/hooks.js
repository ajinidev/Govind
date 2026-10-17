import { createContext, useContext, useEffect, useState } from 'react';

/** Run an async fn whenever `deps` change. Ignores stale responses; keeps old data while reloading. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => !cancelled && setState({ data, loading: false, error: null }),
      (error) => !cancelled && setState({ data: null, loading: false, error }),
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/**
 * Shared app state: `revision` increments after every mutation so lists and sidebar counts refetch;
 * `form` controls the create/edit modal (undefined = closed, null = new task, object = edit).
 */
export const TasksContext = createContext(null);
export const useTasksCtx = () => useContext(TasksContext);
