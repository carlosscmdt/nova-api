// ================================
// Nova AI Store Builder - Production Server
// Deploy to Railway/Render/Vercel
// ================================

import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import compression from "compression";
import fs from "fs/promises";
import archiver from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Services
import { ProductScraper } from "./services/scraper.js";
import { AIGenerator } from "./services/ai-generator.js";

console.log("🔑 Environment:");
console.log("   ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✓ Set" : "✗ Missing");

const app = express();

// CORS - allow requests from anywhere
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(compression());

// ================================
// API Routes
// ================================

// Health check
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "Nova AI Store Builder",
        version: "1.0.0",
        endpoints: ["/api/scrape", "/api/generate", "/api/build", "/api/download"]
    });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
});

// Scrape product from URL
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

// Full build - scrape + generate in one call
app.post("/api/build", async (req, res) => {
    try {
        const { url, options = {} } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        console.log(`🚀 Building store from: ${url}`);

        // Step 1: Scrape
        const scraper = new ProductScraper();
        const productData = await scraper.scrape(url);
        console.log(`   ✓ Scraped: ${productData.title}`);

        // Step 2: Generate AI content
        const generator = new AIGenerator();
        const content = await generator.generateStoreContent(productData, options);
        console.log(`   ✓ Generated content for: ${content.brandName}`);

        res.json({
            success: true,
            data: {
                product: productData,
                content: content
            }
        });
    } catch (error) {
        console.error("Build error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Download theme as ZIP
app.post("/api/download", async (req, res) => {
    try {
        const { product, content } = req.body;
        if (!content?.theme) return res.status(400).json({ error: "Theme data is required" });

        // Create ZIP file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${content.brandName || 'nova'}-theme.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Add theme files
        for (const [path, fileContent] of Object.entries(content.theme)) {
            archive.append(fileContent, { name: path });
        }

        await archive.finalize();
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Preview endpoint - renders a preview of the generated store
app.get("/preview", async (req, res) => {
    try {
        const dataParam = req.query.data;
        if (!dataParam) {
            return res.send(getPreviewHTML(null));
        }

        const data = JSON.parse(decodeURIComponent(dataParam));
        res.send(getPreviewHTML(data));
    } catch (error) {
        console.error("Preview error:", error);
        res.status(500).send("Error generating preview");
    }
});

// Generate preview HTML
function getPreviewHTML(data) {
    if (!data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Nova Store Preview</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
                    h1 { color: #a855f7; }
                </style>
            </head>
            <body>
                <h1>Nova Store Preview</h1>
                <p>No store data provided. Generate a store first!</p>
            </body>
            </html>
        `;
    }

    const { product, content } = data;
    const c = content || {};
    const p = product || {};

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.seo?.title || c.brandName || 'Nova Store'}</title>
    <meta name="description" content="${c.seo?.description || ''}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #1a1a1a; line-height: 1.6; }

        /* Announcement Bar */
        .announcement { background: linear-gradient(135deg, ${c.brand?.primaryColor || '#a855f7'}, ${c.brand?.secondaryColor || '#6366f1'}); color: white; text-align: center; padding: 12px; font-size: 14px; font-weight: 500; }

        /* Header */
        .header { background: white; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 100; }
        .logo { font-size: 24px; font-weight: 800; color: ${c.brand?.primaryColor || '#a855f7'}; }
        .nav { display: flex; gap: 32px; }
        .nav a { color: #666; text-decoration: none; font-weight: 500; }
        .nav a:hover { color: ${c.brand?.primaryColor || '#a855f7'}; }
        .cart-btn { background: ${c.brand?.primaryColor || '#a855f7'}; color: white; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }

        /* Hero */
        .hero { padding: 80px 40px; background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%); }
        .hero-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-content h1 { font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
        .hero-content p { font-size: 18px; color: #666; margin-bottom: 32px; }
        .hero-cta { display: flex; gap: 16px; }
        .btn-primary { background: ${c.brand?.primaryColor || '#a855f7'}; color: white; padding: 16px 32px; border-radius: 8px; border: none; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(168,85,247,0.3); }
        .btn-secondary { background: transparent; border: 2px solid #ddd; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .hero-image { position: relative; }
        .hero-image img { width: 100%; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

        /* Product Section */
        .product-section { padding: 80px 40px; max-width: 1200px; margin: 0 auto; }
        .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .product-images { position: sticky; top: 100px; }
        .product-images img { width: 100%; border-radius: 16px; margin-bottom: 16px; }
        .product-info h1 { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
        .product-subtitle { font-size: 18px; color: #666; margin-bottom: 20px; }
        .product-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .stars { color: #fbbf24; font-size: 20px; }
        .rating-text { color: #666; font-size: 14px; }
        .product-price { margin-bottom: 24px; }
        .price-current { font-size: 36px; font-weight: 800; color: ${c.brand?.primaryColor || '#a855f7'}; }
        .price-original { font-size: 20px; color: #999; text-decoration: line-through; margin-left: 12px; }
        .price-save { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-left: 12px; }
        .urgency { background: #fef3c7; color: #92400e; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; }
        .bullets { margin-bottom: 24px; }
        .bullets li { padding: 8px 0; font-size: 15px; color: #444; list-style: none; }
        .add-to-cart { width: 100%; background: ${c.brand?.primaryColor || '#a855f7'}; color: white; padding: 18px; border-radius: 10px; border: none; font-size: 18px; font-weight: 700; cursor: pointer; margin-bottom: 16px; }
        .add-to-cart:hover { opacity: 0.9; }
        .trust-badges { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
        .trust-badge { font-size: 13px; color: #666; display: flex; align-items: center; gap: 6px; }

        /* Features */
        .features { padding: 80px 40px; background: #fafafa; }
        .features-container { max-width: 1000px; margin: 0 auto; text-align: center; }
        .features h2 { font-size: 36px; font-weight: 700; margin-bottom: 48px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .feature-card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .feature-icon { font-size: 40px; margin-bottom: 16px; }
        .feature-card h3 { font-size: 18px; margin-bottom: 8px; }
        .feature-card p { font-size: 14px; color: #666; }

        /* Stats */
        .stats { padding: 60px 40px; background: ${c.brand?.primaryColor || '#a855f7'}; color: white; }
        .stats-container { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-around; text-align: center; }
        .stat-number { font-size: 48px; font-weight: 800; }
        .stat-label { font-size: 14px; opacity: 0.9; }

        /* Testimonials */
        .testimonials { padding: 80px 40px; }
        .testimonials-container { max-width: 1000px; margin: 0 auto; text-align: center; }
        .testimonials h2 { font-size: 36px; font-weight: 700; margin-bottom: 48px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .testimonial-card { background: #fafafa; padding: 32px; border-radius: 16px; text-align: left; }
        .testimonial-stars { color: #fbbf24; margin-bottom: 16px; }
        .testimonial-quote { font-size: 15px; color: #444; margin-bottom: 20px; font-style: italic; }
        .testimonial-author { font-weight: 600; }
        .testimonial-title { font-size: 13px; color: #666; }

        /* FAQ */
        .faq { padding: 80px 40px; background: #fafafa; }
        .faq-container { max-width: 700px; margin: 0 auto; }
        .faq h2 { font-size: 36px; font-weight: 700; margin-bottom: 48px; text-align: center; }
        .faq-item { background: white; margin-bottom: 12px; border-radius: 12px; overflow: hidden; }
        .faq-question { width: 100%; padding: 20px 24px; text-align: left; font-size: 16px; font-weight: 600; border: none; background: none; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-answer { padding: 0 24px 20px; font-size: 15px; color: #666; }

        /* Footer */
        .footer { padding: 60px 40px; background: #1a1a1a; color: white; text-align: center; }
        .footer-logo { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
        .footer-tagline { color: #888; margin-bottom: 32px; }
        .footer-links { display: flex; justify-content: center; gap: 32px; margin-bottom: 32px; }
        .footer-links a { color: #888; text-decoration: none; font-size: 14px; }
        .footer-bottom { font-size: 13px; color: #666; }

        @media (max-width: 768px) {
            .hero-container, .product-grid, .features-grid, .testimonials-grid { grid-template-columns: 1fr; }
            .hero-content h1 { font-size: 32px; }
            .stats-container { flex-direction: column; gap: 32px; }
        }
    </style>
</head>
<body>
    <!-- Announcement Bar -->
    <div class="announcement">${c.announcementBar || '🔥 Limited Time Offer - Free Shipping on All Orders!'}</div>

    <!-- Header -->
    <header class="header">
        <div class="logo">${c.brandName || 'Nova Store'}</div>
        <nav class="nav">
            <a href="#product">Shop</a>
            <a href="#features">Features</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
        </nav>
        <button class="cart-btn">Cart (0)</button>
    </header>

    <!-- Hero -->
    <section class="hero">
        <div class="hero-container">
            <div class="hero-content">
                <h1>${c.homepage?.heroHeadline || 'Transform Your Life Today'}</h1>
                <p>${c.homepage?.heroSubheadline || 'Discover the product that\'s changing everything.'}</p>
                <div class="hero-cta">
                    <button class="btn-primary">${c.homepage?.ctaButton || 'Shop Now'}</button>
                    <button class="btn-secondary">Learn More</button>
                </div>
            </div>
            <div class="hero-image">
                <img src="${p.images?.[0] || 'https://via.placeholder.com/600x600'}" alt="${c.product?.title || 'Product'}">
            </div>
        </div>
    </section>

    <!-- Product -->
    <section class="product-section" id="product">
        <div class="product-grid">
            <div class="product-images">
                <img src="${p.images?.[0] || 'https://via.placeholder.com/600x600'}" alt="${c.product?.title || 'Product'}">
            </div>
            <div class="product-info">
                <h1>${c.product?.title || p.title || 'Amazing Product'}</h1>
                <p class="product-subtitle">${c.product?.subtitle || ''}</p>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span class="rating-text">${c.product?.socialProof || '4.9 (2,847 reviews)'}</span>
                </div>
                <div class="product-price">
                    <span class="price-current">$${p.price || '49.99'}</span>
                    <span class="price-original">$${p.originalPrice || '99.99'}</span>
                    <span class="price-save">Save ${Math.round((1 - (p.price || 50) / (p.originalPrice || 100)) * 100)}%</span>
                </div>
                <div class="urgency">⚡ ${c.product?.urgencyMessage || 'Limited stock available - Order now!'}</div>
                <ul class="bullets">
                    ${(c.product?.bulletPoints || ['✓ Premium Quality', '✓ Fast Shipping', '✓ 30-Day Guarantee']).map(b => `<li>${b}</li>`).join('')}
                </ul>
                <button class="add-to-cart">Add to Cart - $${p.price || '49.99'}</button>
                <div class="trust-badges">
                    ${(c.trustBadges || ['Free Shipping', '30-Day Guarantee', 'Secure Checkout']).map(b => `<span class="trust-badge">✓ ${b}</span>`).join('')}
                </div>
            </div>
        </div>
    </section>

    <!-- Features -->
    <section class="features" id="features">
        <div class="features-container">
            <h2>Why Choose ${c.brandName || 'Us'}?</h2>
            <div class="features-grid">
                ${(c.homepage?.features || [
                    { icon: '🎯', title: 'Premium Quality', description: 'Built to last with the finest materials' },
                    { icon: '⚡', title: 'Fast Shipping', description: 'Free express shipping on all orders' },
                    { icon: '💎', title: 'Satisfaction Guaranteed', description: '30-day money-back guarantee' }
                ]).map(f => `
                    <div class="feature-card">
                        <div class="feature-icon">${f.icon}</div>
                        <h3>${f.title}</h3>
                        <p>${f.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Stats -->
    <section class="stats">
        <div class="stats-container">
            ${(c.homepage?.stats || [
                { number: '50K+', label: 'Happy Customers' },
                { number: '4.9', label: 'Average Rating' },
                { number: '30', label: 'Day Guarantee' }
            ]).map(s => `
                <div class="stat">
                    <div class="stat-number">${s.number}</div>
                    <div class="stat-label">${s.label}</div>
                </div>
            `).join('')}
        </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials" id="reviews">
        <div class="testimonials-container">
            <h2>What Our Customers Say</h2>
            <div class="testimonials-grid">
                ${(c.homepage?.testimonials || [
                    { quote: 'Amazing product! Exceeded all my expectations.', author: 'Sarah M.', title: 'Verified Buyer', rating: 5 },
                    { quote: 'Fast shipping and great quality. Highly recommend!', author: 'John D.', title: 'Verified Buyer', rating: 5 },
                    { quote: 'Best purchase I\'ve made this year. Love it!', author: 'Emily R.', title: 'Verified Buyer', rating: 5 }
                ]).map(t => `
                    <div class="testimonial-card">
                        <div class="testimonial-stars">${'★'.repeat(t.rating || 5)}</div>
                        <p class="testimonial-quote">"${t.quote}"</p>
                        <div class="testimonial-author">${t.author}</div>
                        <div class="testimonial-title">${t.title}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- FAQ -->
    <section class="faq" id="faq">
        <div class="faq-container">
            <h2>Frequently Asked Questions</h2>
            ${(c.faq || [
                { question: 'How long does shipping take?', answer: 'We offer free express shipping. Most orders arrive within 3-5 business days.' },
                { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, we\'ll refund your purchase.' },
                { question: 'Is this product high quality?', answer: 'Absolutely! We use only premium materials and rigorous quality control.' }
            ]).map(f => `
                <div class="faq-item">
                    <button class="faq-question">${f.question} <span>+</span></button>
                    <div class="faq-answer">${f.answer}</div>
                </div>
            `).join('')}
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-logo">${c.brandName || 'Nova Store'}</div>
        <p class="footer-tagline">${c.brand?.tagline || 'Your satisfaction is our priority.'}</p>
        <div class="footer-links">
            <a href="#">Shop</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} ${c.brandName || 'Nova Store'}. All rights reserved.</div>
    </footer>

    <script>
        // FAQ Toggle
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const answer = btn.nextElementSibling;
                const isOpen = answer.style.display === 'block';
                document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
                document.querySelectorAll('.faq-question span').forEach(s => s.textContent = '+');
                if (!isOpen) {
                    answer.style.display = 'block';
                    btn.querySelector('span').textContent = '-';
                }
            });
        });
        // Hide all FAQ answers initially
        document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
    </script>
</body>
</html>
    `;
}

// ================================
// Start Server
// ================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║         Nova AI Store Builder - Production               ║
║──────────────────────────────────────────────────────────║
║  🚀 Server: http://localhost:${PORT}                         ║
║  📦 Ready to generate stores!                            ║
║──────────────────────────────────────────────────────────║
║  Endpoints:                                              ║
║  POST /api/scrape   - Scrape product from URL            ║
║  POST /api/generate - Generate AI content                ║
║  POST /api/build    - Full store generation              ║
║  POST /api/download - Download theme as ZIP              ║
║  GET  /preview      - Preview generated store            ║
╚══════════════════════════════════════════════════════════╝
    `);
});
