import { useState } from "react";
import api from "../services/api";
import ResponseTimeChart from "./ResponseTimeChart";
import StatusBadge from "./StatusBadge";

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function formatMs(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Math.round(Number(value))} ms`;
}

function formatLastChecked(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function EndpointCard({ endpoint, onDeleted }) {
  const {
    id,
    name,
    url,
    current_status: currentStatus,
    uptime_percentage: uptimePercentage,
    avg_response_time_ms: avgResponseTimeMs,
    last_checked_at: lastCheckedAt,
  } = endpoint;

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    const ok = window.confirm(`Remove “${name}” from monitoring? This cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/endpoints/${id}`);
      onDeleted?.();
    } catch (err) {
      setDeleteError(err.response?.data?.error || err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="endpoint-card">
      <header className="endpoint-card-header">
        <h3 className="endpoint-name">{name}</h3>
        <div className="endpoint-card-actions">
          <StatusBadge status={currentStatus} />
          <button
            type="button"
            className="endpoint-delete"
            onClick={handleDelete}
            disabled={deleting}
            title={deleting ? "Removing…" : "Remove this endpoint"}
            aria-label={deleting ? "Removing endpoint" : `Remove ${name} from monitoring`}
          >
            <TrashIcon />
          </button>
        </div>
      </header>
      <p className="endpoint-url">{url}</p>
      <dl className="endpoint-meta">
        <div>
          <dt>Uptime</dt>
          <dd>{formatPercent(uptimePercentage)}</dd>
        </div>
        <div>
          <dt>Avg response</dt>
          <dd>{formatMs(avgResponseTimeMs)}</dd>
        </div>
        <div>
          <dt>Last checked</dt>
          <dd>{formatLastChecked(lastCheckedAt)}</dd>
        </div>
      </dl>
      {deleteError && <p className="endpoint-delete-error">{deleteError}</p>}
      <ResponseTimeChart endpointId={id} />
    </article>
  );
}
