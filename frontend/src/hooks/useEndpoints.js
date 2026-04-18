import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function useEndpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const { data } = await api.get("/api/endpoints");
      setEndpoints(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to fetch endpoints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
    const intervalId = setInterval(fetchEndpoints, 30000);
    return () => clearInterval(intervalId);
  }, [fetchEndpoints]);

  return { endpoints, loading, error, refetch: fetchEndpoints };
}
