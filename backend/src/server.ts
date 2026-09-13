import express from "express";
import cors from "cors";
import { transactionsRouter } from "./routes/transactions";
import { dashboardRouter } from "./routes/dashboard";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/transactions", transactionsRouter);
app.use("/dashboard", dashboardRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Expense tracker API running on http://localhost:${PORT}`);
});
