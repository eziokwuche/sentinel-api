export default function StatusBadge({ status }) {
  const normalized = status || "UNKNOWN";
  let className = "status-badge status-unknown";

  if (normalized === "UP") {
    className = "status-badge status-up";
  } else if (normalized === "DOWN") {
    className = "status-badge status-down";
  } else if (normalized === "DEGRADED") {
    className = "status-badge status-degraded";
  }

  return <span className={className}>{normalized}</span>;
}
