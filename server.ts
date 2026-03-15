import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// Database Setup
const db = new Database("skyapply.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    structured_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER,
    version_name TEXT,
    tailored_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(resume_id) REFERENCES resumes(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role TEXT,
    country TEXT,
    visa_sponsorship TEXT,
    resume_version_id INTEGER,
    match_score INTEGER,
    match_category TEXT,
    date_applied DATE,
    status TEXT DEFAULT 'Applied',
    followup_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(resume_version_id) REFERENCES resume_versions(id)
  );

  CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

// API Routes
app.post("/api/resume/parse", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let text = "";
    const mimetype = req.file.mimetype;

    if (mimetype === "application/pdf") {
      // @ts-ignore
      const pdf = (await import("pdf-parse")).default;
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (mimetype.startsWith("image/")) {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text: ocrText } } = await worker.recognize(req.file.buffer);
      await worker.terminate();
      text = ocrText;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    res.json({ text });
  } catch (error: any) {
    console.error("Parsing error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Application CRUD
app.get("/api/applications", (req, res) => {
  const apps = db.prepare("SELECT * FROM applications ORDER BY created_at DESC").all();
  res.json(apps);
});

app.post("/api/applications", (req, res) => {
  const { company, role, country, visa_sponsorship, resume_version_id, match_score, match_category, date_applied, notes } = req.body;
  const info = db.prepare(`
    INSERT INTO applications (company, role, country, visa_sponsorship, resume_version_id, match_score, match_category, date_applied, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(company, role, country, visa_sponsorship, resume_version_id, match_score, match_category, date_applied, notes);
  res.json({ id: info.lastInsertRowid });
});

app.patch("/api/applications/:id", (req, res) => {
  const { status, followup_date, notes } = req.body;
  db.prepare("UPDATE applications SET status = ?, followup_date = ?, notes = ? WHERE id = ?")
    .run(status, followup_date, notes, req.params.id);
  res.json({ success: true });
});

// Analytics
app.get("/api/analytics/data", (req, res) => {
  const apps = db.prepare("SELECT * FROM applications").all();
  res.json(apps);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
