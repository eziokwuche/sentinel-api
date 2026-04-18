import { useState } from "react";
import api from "../services/api";

const defaultForm = {
  name: "",
  url: "",
  method: "GET",
  checkIntervalMinutes: 5,
  alertEmail: "",
};

export default function AddEndpointForm({ onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    const value =
      field === "checkIntervalMinutes" ? Number(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        method: form.method,
        checkIntervalMinutes: form.checkIntervalMinutes,
        alertEmail: form.alertEmail.trim() || null,
      };

      await api.post("/api/endpoints", payload);
      setForm(defaultForm);
      setMessage("Endpoint registered.");
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create endpoint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="add-endpoint">
      <h2>Add endpoint</h2>
      <form className="add-endpoint-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={form.name} onChange={handleChange("name")} required />
        </label>
        <label>
          URL
          <input type="url" value={form.url} onChange={handleChange("url")} required />
        </label>
        <label>
          Method
          <select value={form.method} onChange={handleChange("method")}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
          </select>
        </label>
        <label>
          Check interval (minutes)
          <input
            type="number"
            min={1}
            value={form.checkIntervalMinutes}
            onChange={handleChange("checkIntervalMinutes")}
            required
          />
        </label>
        <label>
          Alert email
          <input type="email" value={form.alertEmail} onChange={handleChange("alertEmail")} />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Register"}
        </button>
      </form>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
