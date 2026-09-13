import { Router } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { parseTransactionsCsv } from "../csvParser";

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

export const transactionsRouter = Router();

// Upload a CSV export from your bank/card statement
transactionsRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
  }

  try {
    const csvContent = req.file.buffer.toString("utf-8");
    const parsed = parseTransactionsCsv(csvContent);

    const created = await prisma.$transaction(
      parsed.map((t) =>
        prisma.transaction.create({
          data: {
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category,
            source: "csv-upload",
          },
        })
      )
    );

    res.json({ inserted: created.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse or store CSV. Check the format matches date,description,amount." });
  }
});

// Add a single transaction manually
transactionsRouter.post("/", async (req, res) => {
  const { date, description, amount, category } = req.body;
  if (!date || !description || amount === undefined) {
    return res.status(400).json({ error: "date, description, and amount are required" });
  }

  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      category: category || "Uncategorized",
      source: "manual",
    },
  });

  res.json(transaction);
});

// List transactions (most recent first), optional ?category= filter
transactionsRouter.get("/", async (req, res) => {
  const { category } = req.query;
  const transactions = await prisma.transaction.findMany({
    where: category ? { category: String(category) } : undefined,
    orderBy: { date: "desc" },
    take: 200,
  });
  res.json(transactions);
});

// Update a transaction's category (for correcting bad auto-categorization)
transactionsRouter.patch("/:id/category", async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  const updated = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { category },
  });
  res.json(updated);
});
