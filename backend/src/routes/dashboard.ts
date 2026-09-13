import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dashboardRouter = Router();

function monthRange(monthParam?: string) {
  const now = monthParam ? new Date(`${monthParam}-01`) : new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// Summary for one month: total spent, total income, net, per-category totals
dashboardRouter.get("/summary", async (req, res) => {
  const { start, end } = monthRange(req.query.month as string | undefined);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
  });

  const expenses = transactions.filter((t) => t.amount < 0);
  const income = transactions.filter((t) => t.amount > 0);

  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpenses;

  const byCategory: Record<string, number> = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
  }

  const budgets = await prisma.budget.findMany();
  const budgetVsActual = budgets.map((b) => ({
    category: b.category,
    budget: b.monthlyLimit,
    actual: byCategory[b.category] || 0,
    overBy: Math.max(0, (byCategory[b.category] || 0) - b.monthlyLimit),
  }));

  res.json({
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    totalIncome,
    totalExpenses,
    net,
    byCategory,
    budgetVsActual,
  });
});

// Simple "days until zero at current burn rate" estimate
dashboardRouter.get("/burn-rate", async (req, res) => {
  const currentBalance = parseFloat((req.query.balance as string) || "0");
  const { start, end } = monthRange();

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end }, amount: { lt: 0 } },
  });

  const daysElapsed = Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86400000));
  const totalSpent = Math.abs(transactions.reduce((sum, t) => sum + t.amount, 0));
  const dailyBurn = totalSpent / daysElapsed;
  const daysUntilZero = dailyBurn > 0 ? Math.floor(currentBalance / dailyBurn) : null;

  res.json({ dailyBurn: Math.round(dailyBurn), daysUntilZero });
});
