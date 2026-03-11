const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const port = Number(process.env.PORT || 3000);
const ADMIN_USERNAME = "fariavictor@live.com";
const ADMIN_PASSWORD = "01043678vV@";

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

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TEXT NOT NULL
  );
`);

function ensureConfiguredAdmin() {
  const nowIso = new Date().toISOString();
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(ADMIN_USERNAME);

  if (existing) {
    db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(
      hash,
      existing.id
    );
    return;
  }

  db.prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)").run(
    ADMIN_USERNAME,
    hash,
    "admin",
    nowIso
  );
}

ensureConfiguredAdmin();

app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gerador-orcamentos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Nao autenticado." });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Nao autenticado." });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }
  return next();
}

app.get("/", (_req, res) => {
  return res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/login", (_req, res) => {
  return res.redirect("/");
});

app.get("/register", (_req, res) => {
  return res.sendFile(path.join(__dirname, "register.html"));
});

app.get("/app", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/users", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  if (req.session.user.role !== "admin") {
    return res.redirect("/app");
  }
  return res.sendFile(path.join(__dirname, "users.html"));
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Informe usuario e senha." });
  }

  const user = db
    .prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  return res.json({ user: req.session.user });
});

app.post("/api/auth/register", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Informe usuario e senha." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }

  const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (exists) {
    return res.status(409).json({ error: "Usuario ja existe." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const nowIso = new Date().toISOString();

  const result = db
    .prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, 'user', ?)")
    .run(username, hash, nowIso);

  return res.status(201).json({
    id: Number(result.lastInsertRowid),
    username,
    role: "user",
    createdAt: nowIso
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Nao autenticado." });
  }
  return res.json({ user: req.session.user });
});

app.get("/api/users", requireAdmin, (_req, res) => {
  const users = db
    .prepare("SELECT id, username, role, created_at AS createdAt FROM users ORDER BY id DESC")
    .all();
  return res.json({ users });
});

app.post("/api/users", requireAdmin, (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const role = req.body?.role === "admin" ? "admin" : "user";

  if (!username || !password) {
    return res.status(400).json({ error: "Informe usuario e senha." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }

  const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (exists) {
    return res.status(409).json({ error: "Usuario ja existe." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const nowIso = new Date().toISOString();

  const result = db
    .prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)")
    .run(username, hash, role, nowIso);

  return res.status(201).json({
    id: Number(result.lastInsertRowid),
    username,
    role,
    createdAt: nowIso
  });
});

app.get("/api/budgets/next-number", requireAuth, (_req, res) => {
  const row = db.prepare("SELECT IFNULL(MAX(id), 0) + 1 AS nextNumber FROM budgets").get();
  res.json({ nextNumber: row.nextNumber });
});

app.post("/api/budgets", requireAuth, (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];

  if (
    !body.clientName ||
    !body.clientStreet ||
    !body.clientCity ||
    !body.clientZip ||
    !body.clientState ||
    !body.clientPhone ||
    !body.paymentCondition
  ) {
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

app.use(express.static(__dirname, { index: false }));

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
