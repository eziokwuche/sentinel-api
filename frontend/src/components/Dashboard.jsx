import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import EndpointCard from "./EndpointCard";

export default function Dashboard({ refreshKey = 0, onEndpointsChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const { data } = await api.get("/api/dashboard");
      setRows(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEndpointDeleted = useCallback(async () => {
    await loadDashboard();
    onEndpointsChanged?.();
  }, [loadDashboard, onEndpointsChanged]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  useEffect(() => {
    const intervalId = setInterval(loadDashboard, 30000);
    return () => clearInterval(intervalId);
  }, [loadDashboard]);

  if (loading && rows.length === 0) {
    return <p className="dashboard-loading">Loading dashboard…</p>;
  }

  if (error && rows.length === 0) {
    return <p className="dashboard-error">{error}</p>;
  }

  return (
    <section className="dashboard">
      <h2>Monitored endpoints</h2>
      {rows.length === 0 ? (
        <p className="dashboard-empty">No endpoints yet. Add one above.</p>
      ) : (
        <div className="endpoint-grid">
          {rows.map((row) => (
            <EndpointCard key={row.id} endpoint={row} onDeleted={handleEndpointDeleted} />
          ))}
        </div>
      )}
    </section>
  );
}
