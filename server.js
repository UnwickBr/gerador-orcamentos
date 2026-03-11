const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const port = Number(process.env.PORT || 3000);

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "budgets.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    client_name TEXT,
    total REAL NOT NULL DEFAULT 0
  );
`);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/budgets/next-number", (_req, res) => {
  const row = db.prepare("SELECT IFNULL(MAX(id), 0) + 1 AS nextNumber FROM budgets").get();
  res.json({ nextNumber: row.nextNumber });
});

app.post("/api/budgets", (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];

  if (!body.clientName || !body.clientStreet || !body.clientCity || !body.clientZip || !body.clientState || !body.clientPhone || !body.paymentCondition) {
    return res.status(400).json({ error: "Campos obrigatorios do cliente nao preenchidos." });
  }

  if (items.length === 0) {
    return res.status(400).json({ error: "Inclua ao menos um item." });
  }

  const total = Number(body.total || 0);
  const nowIso = new Date().toISOString();

  const result = db
    .prepare(
      "INSERT INTO budgets (created_at, payload_json, client_name, total) VALUES (?, ?, ?, ?)"
    )
    .run(nowIso, JSON.stringify(body), String(body.clientName), total);

  const budgetNumber = Number(result.lastInsertRowid);
  return res.status(201).json({
    id: budgetNumber,
    budgetNumber,
    createdAt: nowIso
  });
});

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
