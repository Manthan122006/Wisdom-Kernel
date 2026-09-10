/**
 * useApi.js
 * ---------
 * One hook for every read-only backend call, so each page gets the same
 * loading / error / empty / success handling without repeating it.
 *
 * Usage:
 *   const { data, loading, error, reload } = useApi(() => api.mistakes(), []);
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { describeError } from "../api/api";

export function useApi(requestFn, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against setting state after unmount, and against a slow earlier
  // request overwriting the result of a newer one.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      if (mounted.current && id === requestId.current) {
        setData(result);
      }
    } catch (err) {
      if (mounted.current && id === requestId.current) {
        setError(describeError(err));
        setData(null);
      }
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run };
}

export default useApi;
