import { useState } from "react";
import AddEndpointForm from "./components/AddEndpointForm";
import Dashboard from "./components/Dashboard";
import { useEndpoints } from "./hooks/useEndpoints";
import "./App.css";

export default function App() {
  const { endpoints, loading, error, refetch } = useEndpoints();
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const handleEndpointAdded = () => {
    refetch();
    setDashboardRefreshKey((key) => key + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sentinel API</h1>
        <p className="app-subtitle">
          Real-time API reliability monitoring
          {!loading && !error && (
            <span className="endpoint-count"> · {endpoints.length} endpoint(s) registered</span>
          )}
        </p>
        {error && <p className="app-hook-error">Endpoints list: {error}</p>}
      </header>

      <AddEndpointForm onSuccess={handleEndpointAdded} />
      <Dashboard refreshKey={dashboardRefreshKey} />
    </div>
  );
}
