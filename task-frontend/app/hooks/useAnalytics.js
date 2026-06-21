"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * Loads /tasks/analytics for a given time range and exposes a refetch() so
 * any screen that mutates tasks/categories (toggle complete, add task,
 * delete category, etc.) can trigger a refresh — this is what makes the
 * dashboard numbers feel "live" without needing websockets for a
 * single-user task app.
 */
export function useAnalytics(range = "7d") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(`/tasks/analytics?range=${range}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
