import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function ResponseTimeChart({ endpointId }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get(`/api/endpoints/${endpointId}/history`);
        if (cancelled) return;

        const cutoff = Date.now() - MS_PER_DAY;
        const filtered = (data || []).filter((row) => {
          const t = new Date(row.checked_at).getTime();
          return !Number.isNaN(t) && t >= cutoff;
        });

        const chronological = [...filtered].reverse();
        const chartPoints = chronological.map((row) => ({
          time: new Date(row.checked_at).toLocaleString(),
          responseTimeMs: row.response_time_ms ?? 0,
        }));

        setPoints(chartPoints);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || "Failed to load history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const intervalId = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [endpointId]);

  const hasData = useMemo(() => points.length > 0, [points]);

  if (loading && !hasData) {
    return <p className="chart-placeholder">Loading chart…</p>;
  }

  if (error) {
    return <p className="chart-error">{error}</p>;
  }

  if (!hasData) {
    return <p className="chart-placeholder">No checks in the last 24 hours.</p>;
  }

  return (
    <div className="chart-wrap">
      <h4 className="chart-title">Response time (last 24h)</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} label={{ value: "ms", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line type="monotone" dataKey="responseTimeMs" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
