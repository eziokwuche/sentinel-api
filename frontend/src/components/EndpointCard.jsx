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

export default function EndpointCard({ endpoint }) {
  const {
    id,
    name,
    url,
    current_status: currentStatus,
    uptime_percentage: uptimePercentage,
    avg_response_time_ms: avgResponseTimeMs,
    last_checked_at: lastCheckedAt,
  } = endpoint;

  return (
    <article className="endpoint-card">
      <header className="endpoint-card-header">
        <h3 className="endpoint-name">{name}</h3>
        <StatusBadge status={currentStatus} />
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
      <ResponseTimeChart endpointId={id} />
    </article>
  );
}
