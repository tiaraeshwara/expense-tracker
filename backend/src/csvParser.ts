import { parse } from "csv-parse/sync";

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  category: string;
}

// Starter keyword rules. These get replaced by the LLM categorization
// agent in the next phase — this is just enough to make the dashboard
// useful on day one.
const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "Groceries", keywords: ["keells", "cargills", "arpico", "supermarket", "grocery"] },
  { category: "Eating out", keywords: ["kfc", "pizzahut", "dominos", "uber eats", "pickme food", "restaurant", "cafe"] },
  { category: "Transport", keywords: ["pickme", "uber", "fuel", "petrol", "diesel", "taxi"] },
  { category: "Subscriptions", keywords: ["netflix", "spotify", "youtube premium", "icloud", "google one", "prime"] },
  { category: "Utilities", keywords: ["ceb", "electricity", "water board", "dialog", "slt", "mobitel", "internet"] },
  { category: "Shopping", keywords: ["daraz", "kapruka", "amazon"] },
];

function guessCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return rule.category;
    }
  }
  return "Uncategorized";
}

/**
 * Expects a CSV with headers: date, description, amount
 * (case-insensitive; matches most bank statement exports).
 */
export function parseTransactionsCsv(csvContent: string): ParsedTransaction[] {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const description = row["description"] ?? row["details"] ?? "";
    const amount = parseFloat(row["amount"] ?? "0");
    const dateStr = row["date"] ?? "";

    return {
      date: new Date(dateStr),
      description,
      amount,
      category: guessCategory(description),
    };
  });
}
