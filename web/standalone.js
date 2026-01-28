// ================================
// Nova AI Store Builder - Standalone Mode
// Öffne http://localhost:3000 im Browser
// ================================

import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import compression from "compression";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Services
import { ProductScraper } from "./services/scraper.js";
import { AIGenerator } from "./services/ai-generator.js";

console.log("🔑 Environment:");
console.log("   ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✓ Set" : "✗ Missing");

const app = express();
app.use(express.json());
app.use(compression());

// ================================
// API Routes (ohne Auth)
// ================================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Scrape product
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    console.log(`🔍 Scraping: ${url}`);
    const scraper = new ProductScraper();
    const productData = await scraper.scrape(url);

    res.json({ success: true, data: productData });
  } catch (error) {
    console.error("Scrape error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI content
app.post("/api/generate", async (req, res) => {
  try {
    const { productData, options } = req.body;
    if (!productData) return res.status(400).json({ error: "Product data is required" });

    console.log(`🤖 Generating content for: ${productData.title}`);
    const generator = new AIGenerator();
    const content = await generator.generateStoreContent(productData, options);

    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Store Preview Page
app.get("/preview", (req, res) => {
  res.sendFile(join(__dirname, "frontend/public/preview.html"));
});

// ================================
// Serve Frontend
// ================================
app.use(express.static(join(__dirname, "frontend/public")));
app.use(express.static(join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "frontend/dist/index.html"));
});

// ================================
// Start
// ================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Nova AI Store Builder                    ║
║──────────────────────────────────────────────────║
║  🚀 Server: http://localhost:${PORT}                ║
║  📦 Mode: Standalone (kein Shopify Auth nötig)   ║
╚══════════════════════════════════════════════════╝

👉 Öffne http://localhost:${PORT} im Browser!
  `);
});
