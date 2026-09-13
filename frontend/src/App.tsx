import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Summary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  byCategory: Record<string, number>;
}

const API = "/api";

function formatLKR(n: number) {
  return `Rs. ${Math.round(n).toLocaleString()}`;
}

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const loadSummary = async () => {
    const res = await fetch(`${API}/dashboard/summary`);
    const data = await res.json();
    setSummary(data);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/transactions/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Imported ${data.inserted} transactions.`);
        await loadSummary();
      } else {
        setStatusMsg(data.error || "Upload failed.");
      }
    } catch (err) {
      setStatusMsg("Could not reach the server. Is the backend running?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const chartData = summary
    ? Object.entries(summary.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => ({ category, amount }))
    : [];

  return (
    <div className="app">
      <h1>Expense Tracker</h1>
      <p className="subtitle">
        {summary ? `Showing ${summary.month}` : "Loading..."}
      </p>

      <div className="card">
        <div className="upload-row">
          <label htmlFor="csv-upload">
            <button
              type="button"
              disabled={uploading}
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              {uploading ? "Uploading..." : "Upload statement CSV"}
            </button>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <span className="status-msg">
            Expects columns: date, description, amount
          </span>
        </div>
        {statusMsg && <p className="status-msg">{statusMsg}</p>}
      </div>

      {summary && (
        <>
          <div className="summary-grid">
            <div className="card">
              <div className="stat-label">Income this month</div>
              <div className="stat-value positive">{formatLKR(summary.totalIncome)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Expenses this month</div>
              <div className="stat-value negative">{formatLKR(summary.totalExpenses)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Net</div>
              <div className={`stat-value ${summary.net >= 0 ? "positive" : "negative"}`}>
                {formatLKR(summary.net)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: 16 }}>
              Spending by category
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={110} fontSize={12} />
                <Tooltip formatter={(v: number) => formatLKR(v)} />
                <Bar dataKey="amount" fill="#1a1d23" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <ul className="category-list">
              {chartData.map(({ category, amount }) => (
                <li key={category}>
                  <span>{category}</span>
                  <span>{formatLKR(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
