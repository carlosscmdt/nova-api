// ================================
// Nova AI Store Builder
// Shopify Embedded App - Backend
// ================================

// Load environment variables FIRST (with override for existing empty vars)
import dotenv from "dotenv";
dotenv.config({ override: true });

import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import compression from "compression";
import serveStatic from "serve-static";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔑 Environment loaded:");
console.log("   SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? "✓ Set" : "✗ Missing");
console.log("   ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✓ Set" : "✗ Missing");

// Services
import { ProductScraper } from "./services/scraper.js";
import { AIGenerator } from "./services/ai-generator.js";
import { StoreBuilder } from "./services/store-builder.js";
const PORT = parseInt(process.env.PORT || "3000", 10);

// ================================
// Shopify App Configuration
// ================================
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(",") || [
      "read_products",
      "write_products",
      "read_themes",
      "write_themes",
      "read_content",
      "write_content",
      "read_files",
      "write_files"
    ],
    hostName: process.env.HOST?.replace(/https?:\/\//, "") || "localhost:3000",
    isEmbeddedApp: true,
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(join(__dirname, "sessions.sqlite")),
});

// ================================
// Express App
// ================================
const app = express();

// Shopify auth & webhook handlers
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), shopify.redirectToShopifyOrAppRoot());
app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers: {} }));

// Auth middleware for API routes
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());
app.use(compression());

// ================================
// API Routes
// ================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Scrape product from URL
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

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

    if (!productData) {
      return res.status(400).json({ error: "Product data is required" });
    }

    console.log(`🤖 Generating content for: ${productData.title}`);

    const generator = new AIGenerator();
    const content = await generator.generateStoreContent(productData, options);

    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Build store (create product, theme sections, etc.)
app.post("/api/build-store", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { productData, content, options } = req.body;

    if (!productData || !content) {
      return res.status(400).json({ error: "Product data and content are required" });
    }

    console.log(`🚀 Building store for: ${session.shop}`);

    const builder = new StoreBuilder(session, shopify);
    const result = await builder.build(productData, content, options);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Build error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get shop info
app.get("/api/shop", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Rest({ session });

    const response = await client.get({ path: "shop" });

    res.json({ success: true, data: response.body.shop });
  } catch (error) {
    console.error("Shop error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get products
app.get("/api/products", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Rest({ session });

    const response = await client.get({ path: "products", query: { limit: 50 } });

    res.json({ success: true, data: response.body.products });
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// Serve Frontend
// ================================
app.use(serveStatic(join(__dirname, "frontend/dist"), { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (req, res) => {
  res.set("Content-Type", "text/html");

  const htmlFile = join(__dirname, "frontend/dist/index.html");

  try {
    const fs = await import("fs/promises");
    let html = await fs.readFile(htmlFile, "utf8");

    // Inject Shopify API key for App Bridge
    html = html.replace(
      "%SHOPIFY_API_KEY%",
      process.env.SHOPIFY_API_KEY || ""
    );

    res.send(html);
  } catch (error) {
    // Fallback HTML if frontend not built
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nova AI Store Builder</title>
          <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; text-align: center; }
            h1 { color: #5c6ac4; }
          </style>
        </head>
        <body>
          <h1>Nova AI Store Builder</h1>
          <p>App is loading... If this persists, run <code>npm run build</code> in the frontend directory.</p>
        </body>
      </html>
    `);
  }
});

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     Nova AI Store Builder                ║
║──────────────────────────────────────────║
║  🚀 Server running on port ${PORT}          ║
║  📦 Shopify Embedded App Mode            ║
╚══════════════════════════════════════════╝
  `);
});
