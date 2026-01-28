// ================================
// Nova - AI Content Generator
// Creates conversion-optimized store content
// ================================

import Anthropic from "@anthropic-ai/sdk";
import { ThemeGenerator } from "./theme-generator.js";

export class AIGenerator {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.client;
  }

  // ================================
  // Generate Complete Store Content
  // ================================
  async generateStoreContent(productData, options = {}) {
    const {
      language = "en",
      tone = "premium",
      targetAudience = "general",
    } = options;

    console.log(`🤖 Generating store content...`);

    // Generate brand name from product
    const brandName = this.generateBrandName(productData.title);

    // Single comprehensive prompt for all content
    const prompt = this.buildMasterPrompt(productData, {
      brandName,
      language,
      tone,
      targetAudience,
    });

    try {
      const response = await this.getClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = this.parseResponse(response.content[0].text);

      // Generate Shopify Liquid theme
      const themeGen = new ThemeGenerator(content, productData);
      const theme = themeGen.generateTheme();

      return {
        brandName,
        ...content,
        theme, // Full Shopify Liquid templates
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  // ================================
  // Master Prompt Builder
  // ================================
  buildMasterPrompt(productData, options) {
    const { brandName, language, tone, targetAudience } = options;

    const langInstruction = language === "de" ? "Write ALL content in German." : "Write ALL content in English.";

    return `You are an elite e-commerce copywriter and conversion optimization specialist. Your copy converts at 2-3x industry average. You understand psychology, urgency, social proof, and emotional triggers.

PRODUCT DATA:
- Title: ${productData.title}
- Price: $${productData.price}
- Original Price: $${productData.originalPrice || productData.price * 2}
- Description: ${productData.description?.substring(0, 500) || "N/A"}
- Features: ${JSON.stringify(productData.bullets || productData.specifications || [])}
- Variants: ${JSON.stringify(productData.variants || [])}

BRAND NAME: ${brandName}
TARGET AUDIENCE: ${targetAudience}
TONE: ${tone} (premium, trustworthy, aspirational)
${langInstruction}

Generate COMPLETE store content in this EXACT JSON format:

{
  "product": {
    "title": "Short, benefit-focused product title (max 60 chars)",
    "subtitle": "Powerful one-line value proposition with emotional trigger",
    "description": "2-3 compelling paragraphs. Start with the transformation/result. Include social proof references. End with a soft CTA. Use power words: Revolutionary, Proven, Exclusive, Limited, Transform, Discover.",
    "shortDescription": "One punchy sentence for product cards",
    "bulletPoints": [
      "✓ Benefit-focused point with specific outcome",
      "✓ Another benefit with social proof or stat",
      "✓ Convenience/ease of use benefit",
      "✓ Trust/quality benefit",
      "✓ Unique differentiator"
    ],
    "specifications": [
      {"label": "Key Spec", "value": "Specific Value"}
    ],
    "urgencyMessage": "Scarcity message - e.g., 'Only 23 left at this price' or 'Sale ends tonight'",
    "socialProof": "Specific social proof - e.g., '47,000+ happy customers' or 'As seen in Forbes'"
  },
  "brand": {
    "tagline": "Memorable brand tagline (5-8 words, aspirational)",
    "story": "2-3 paragraph brand story. Origin, mission, why you're different. Make it relatable and human.",
    "values": ["Value 1", "Value 2", "Value 3"],
    "primaryColor": "#hex - suggest a color that evokes trust and premium feel",
    "secondaryColor": "#hex - complementary accent color"
  },
  "homepage": {
    "heroHeadline": "Bold, benefit-driven headline (transforms the reader)",
    "heroSubheadline": "Supporting text that addresses pain point and hints at solution",
    "ctaButton": "Action-oriented CTA (Shop Now, Get Yours, Start Transforming)",
    "features": [
      {
        "icon": "🎯",
        "title": "Feature benefit title",
        "description": "Short description focusing on customer outcome"
      },
      {
        "icon": "⚡",
        "title": "Another feature",
        "description": "Description"
      },
      {
        "icon": "💎",
        "title": "Third feature",
        "description": "Description"
      }
    ],
    "stats": [
      {"number": "50K+", "label": "Happy Customers"},
      {"number": "4.9", "label": "Average Rating"},
      {"number": "30", "label": "Day Guarantee"}
    ],
    "testimonials": [
      {
        "quote": "Realistic testimonial focusing on transformation and specific result",
        "author": "First Name L.",
        "title": "Verified Buyer",
        "rating": 5
      },
      {
        "quote": "Another testimonial addressing a common objection",
        "author": "First Name L.",
        "title": "Verified Buyer",
        "rating": 5
      },
      {
        "quote": "Testimonial highlighting customer service or quality",
        "author": "First Name L.",
        "title": "Verified Buyer",
        "rating": 5
      }
    ]
  },
  "faq": [
    {
      "question": "Shipping question",
      "answer": "Clear answer with specifics. Free shipping over $X, delivery in Y days."
    },
    {
      "question": "Return/guarantee question",
      "answer": "Reassuring answer that removes risk"
    },
    {
      "question": "Product quality question",
      "answer": "Answer that builds trust"
    },
    {
      "question": "Common objection as question",
      "answer": "Answer that overcomes the objection"
    },
    {
      "question": "Usage/care question",
      "answer": "Helpful answer"
    }
  ],
  "seo": {
    "title": "SEO title (max 60 chars) - Brand | Product | Benefit",
    "description": "Meta description (max 155 chars) with keywords and CTA",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "trustBadges": [
    "Free Shipping Over $75",
    "30-Day Money Back Guarantee",
    "Secure Checkout",
    "24/7 Support"
  ],
  "announcementBar": "Compelling announcement - e.g., '🔥 FLASH SALE: 50% OFF + Free Shipping - Ends Tonight!'"
}

IMPORTANT RULES:
1. NEVER be generic. Every line must be specific and compelling.
2. Use numbers and specifics (not "many customers" but "47,832 customers")
3. Address pain points before presenting solutions
4. Create urgency without being sleazy
5. Make benefits tangible (not "better sleep" but "wake up refreshed after 8 hours of deep, uninterrupted sleep")
6. Include emotional triggers throughout
7. Write like a human, not a robot

Return ONLY the JSON, no explanation.`;
  }

  // ================================
  // Parse AI Response
  // ================================
  parseResponse(text) {
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch =
        text.match(/```json\n?([\s\S]*?)\n?```/) ||
        text.match(/```\n?([\s\S]*?)\n?```/) ||
        [null, text];

      const jsonStr = jsonMatch[1] || text;
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error("JSON parse error:", error);
      console.error("Raw text:", text.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  // ================================
  // Generate Brand Name
  // ================================
  generateBrandName(productTitle) {
    if (!productTitle) return "Nova Store";

    // Extract meaningful words
    const stopWords = [
      "the", "a", "an", "for", "with", "and", "or", "in", "on", "at",
      "to", "of", "new", "hot", "sale", "best", "top", "free", "shipping",
      "2024", "2025", "pcs", "set", "kit", "pro", "mini", "max", "plus"
    ];

    const words = productTitle
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.includes(w))
      .slice(0, 2);

    if (words.length === 0) return "Nova Store";

    // Create brand name
    const brandOptions = [
      words[0].charAt(0).toUpperCase() + words[0].slice(1),
      words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""),
      words[0].charAt(0).toUpperCase() + words[0].slice(1) + "ify",
      words[0].charAt(0).toUpperCase() + words[0].slice(1) + "ly",
    ];

    // Return a clean brand name
    return brandOptions[0].length > 12 ? brandOptions[0].substring(0, 12) : brandOptions[0];
  }
}

export default AIGenerator;
