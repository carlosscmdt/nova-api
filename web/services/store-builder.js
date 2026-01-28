// ================================
// Nova - Store Builder Service
// Creates products, uploads images, configures themes
// ================================

export class StoreBuilder {
  constructor(session, shopify) {
    this.session = session;
    this.shopify = shopify;
    this.restClient = null;
    this.graphqlClient = null;
  }

  getRestClient() {
    if (!this.restClient) {
      this.restClient = new this.shopify.api.clients.Rest({ session: this.session });
    }
    return this.restClient;
  }

  getGraphQLClient() {
    if (!this.graphqlClient) {
      this.graphqlClient = new this.shopify.api.clients.Graphql({ session: this.session });
    }
    return this.graphqlClient;
  }

  // ================================
  // Main Build Method
  // ================================
  async build(productData, content, options = {}) {
    console.log(`🚀 Building store for ${this.session.shop}...`);

    const results = {
      product: null,
      images: [],
      metafields: null,
      themeSettings: null,
      pages: [],
    };

    try {
      // Step 1: Create the product
      console.log("📦 Creating product...");
      results.product = await this.createProduct(productData, content);

      // Step 2: Upload product images
      if (productData.images?.length > 0) {
        console.log("🖼️ Uploading images...");
        results.images = await this.uploadProductImages(results.product.id, productData.images);
      }

      // Step 3: Set product metafields (for additional content)
      console.log("📝 Setting metafields...");
      results.metafields = await this.setProductMetafields(results.product.id, content);

      // Step 4: Configure theme settings
      console.log("🎨 Configuring theme...");
      results.themeSettings = await this.configureTheme(content);

      // Step 5: Create/update pages (About, FAQ, etc.)
      console.log("📄 Creating pages...");
      results.pages = await this.createPages(content);

      console.log("✅ Store build complete!");

      return {
        success: true,
        shop: this.session.shop,
        productId: results.product.id,
        productHandle: results.product.handle,
        productUrl: `https://${this.session.shop}/products/${results.product.handle}`,
        adminUrl: `https://${this.session.shop}/admin/products/${results.product.id}`,
        ...results,
      };
    } catch (error) {
      console.error("Store build error:", error);
      throw error;
    }
  }

  // ================================
  // Create Product
  // ================================
  async createProduct(productData, content) {
    const client = this.getRestClient();

    // Build product data from scraped data + AI content
    const product = {
      title: content.product?.title || productData.title,
      body_html: this.buildProductHTML(productData, content),
      vendor: content.brandName || "Nova Store",
      product_type: this.extractProductType(productData.title),
      tags: this.generateTags(productData, content),
      status: "active",
    };

    // Add variants with pricing
    product.variants = this.buildVariants(productData, content);

    // Add SEO data
    if (content.seo) {
      product.metafields_global_title_tag = content.seo.title;
      product.metafields_global_description_tag = content.seo.description;
    }

    const response = await client.post({
      path: "products",
      data: { product },
    });

    return response.body.product;
  }

  // ================================
  // Build Product HTML
  // ================================
  buildProductHTML(productData, content) {
    const p = content.product || {};

    let html = `
<div class="nova-product-content">
  <!-- Subtitle/Value Proposition -->
  ${p.subtitle ? `<p class="product-subtitle" style="font-size: 1.1em; color: #666; margin-bottom: 20px;">${p.subtitle}</p>` : ""}

  <!-- Main Description -->
  <div class="product-description" style="margin-bottom: 30px;">
    ${p.description || productData.description || ""}
  </div>

  <!-- Key Benefits -->
  ${
    p.bulletPoints?.length > 0
      ? `
  <div class="product-benefits" style="margin-bottom: 30px;">
    <h3 style="margin-bottom: 15px;">Why You'll Love It</h3>
    <ul style="list-style: none; padding: 0;">
      ${p.bulletPoints.map((point) => `<li style="padding: 8px 0; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0;">✓</span> ${point.replace(/^[✓✔☑]\s*/, "")}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  <!-- Specifications -->
  ${
    p.specifications?.length > 0
      ? `
  <div class="product-specifications" style="margin-bottom: 30px;">
    <h3 style="margin-bottom: 15px;">Specifications</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${p.specifications.map((spec) => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${spec.label}</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${spec.value}</td></tr>`).join("")}
    </table>
  </div>
  `
      : ""
  }

  <!-- Social Proof -->
  ${p.socialProof ? `<p class="social-proof" style="text-align: center; padding: 15px; background: #f8f8f8; border-radius: 8px; font-weight: 500;">⭐ ${p.socialProof}</p>` : ""}
</div>
`;

    return html;
  }

  // ================================
  // Build Variants
  // ================================
  buildVariants(productData, content) {
    const variants = [];
    const price = parseFloat(productData.price) || 29.99;
    const compareAtPrice = parseFloat(productData.originalPrice) || price * 2;

    if (productData.variants?.length > 0) {
      // Build variants from scraped data
      const colorOptions = productData.variants.find((v) => v.name?.toLowerCase().includes("color"))?.options || [];

      if (colorOptions.length > 0) {
        colorOptions.forEach((option, idx) => {
          variants.push({
            option1: option.name || option,
            price: price.toFixed(2),
            compare_at_price: compareAtPrice.toFixed(2),
            sku: `NOVA-${Date.now()}-${idx}`,
            inventory_management: "shopify",
            inventory_quantity: 100,
          });
        });
      } else {
        // Default single variant
        variants.push({
          price: price.toFixed(2),
          compare_at_price: compareAtPrice.toFixed(2),
          sku: `NOVA-${Date.now()}`,
          inventory_management: "shopify",
          inventory_quantity: 100,
        });
      }
    } else {
      // Default single variant
      variants.push({
        price: price.toFixed(2),
        compare_at_price: compareAtPrice.toFixed(2),
        sku: `NOVA-${Date.now()}`,
        inventory_management: "shopify",
        inventory_quantity: 100,
      });
    }

    return variants;
  }

  // ================================
  // Upload Product Images
  // ================================
  async uploadProductImages(productId, images) {
    const client = this.getRestClient();
    const uploaded = [];

    for (let i = 0; i < Math.min(images.length, 10); i++) {
      try {
        const imageUrl = images[i];

        const response = await client.post({
          path: `products/${productId}/images`,
          data: {
            image: {
              src: imageUrl,
              position: i + 1,
            },
          },
        });

        uploaded.push(response.body.image);
        console.log(`  ✓ Image ${i + 1} uploaded`);
      } catch (error) {
        console.error(`  ✗ Image ${i + 1} failed:`, error.message);
      }
    }

    return uploaded;
  }

  // ================================
  // Set Product Metafields
  // ================================
  async setProductMetafields(productId, content) {
    const client = this.getRestClient();
    const metafields = [];

    // Store urgency message
    if (content.product?.urgencyMessage) {
      metafields.push({
        namespace: "nova",
        key: "urgency_message",
        value: content.product.urgencyMessage,
        type: "single_line_text_field",
      });
    }

    // Store social proof
    if (content.product?.socialProof) {
      metafields.push({
        namespace: "nova",
        key: "social_proof",
        value: content.product.socialProof,
        type: "single_line_text_field",
      });
    }

    // Store trust badges
    if (content.trustBadges?.length > 0) {
      metafields.push({
        namespace: "nova",
        key: "trust_badges",
        value: JSON.stringify(content.trustBadges),
        type: "json",
      });
    }

    // Store homepage features
    if (content.homepage?.features?.length > 0) {
      metafields.push({
        namespace: "nova",
        key: "features",
        value: JSON.stringify(content.homepage.features),
        type: "json",
      });
    }

    // Store testimonials
    if (content.homepage?.testimonials?.length > 0) {
      metafields.push({
        namespace: "nova",
        key: "testimonials",
        value: JSON.stringify(content.homepage.testimonials),
        type: "json",
      });
    }

    // Store FAQ
    if (content.faq?.length > 0) {
      metafields.push({
        namespace: "nova",
        key: "faq",
        value: JSON.stringify(content.faq),
        type: "json",
      });
    }

    // Create metafields
    for (const metafield of metafields) {
      try {
        await client.post({
          path: `products/${productId}/metafields`,
          data: { metafield },
        });
      } catch (error) {
        console.error(`Metafield error (${metafield.key}):`, error.message);
      }
    }

    return metafields;
  }

  // ================================
  // Configure Theme
  // ================================
  async configureTheme(content) {
    const client = this.getRestClient();

    try {
      // Get the active theme
      const themesResponse = await client.get({ path: "themes" });
      const activeTheme = themesResponse.body.themes.find((t) => t.role === "main");

      if (!activeTheme) {
        console.log("No active theme found");
        return null;
      }

      console.log(`  Theme: ${activeTheme.name} (ID: ${activeTheme.id})`);

      // Update theme settings
      const settings = this.buildThemeSettings(content);

      // Get current settings
      const settingsResponse = await client.get({
        path: `themes/${activeTheme.id}/assets`,
        query: { "asset[key]": "config/settings_data.json" },
      });

      let currentSettings = {};
      try {
        currentSettings = JSON.parse(settingsResponse.body.asset.value);
      } catch (e) {}

      // Merge new settings
      const currentPreset = currentSettings.current || {};
      const newSettings = {
        ...currentSettings,
        current: {
          ...currentPreset,
          ...settings,
        },
      };

      // Update settings
      await client.put({
        path: `themes/${activeTheme.id}/assets`,
        data: {
          asset: {
            key: "config/settings_data.json",
            value: JSON.stringify(newSettings, null, 2),
          },
        },
      });

      // Update announcement bar if supported
      if (content.announcementBar) {
        await this.updateAnnouncementBar(activeTheme.id, content.announcementBar);
      }

      return {
        themeId: activeTheme.id,
        themeName: activeTheme.name,
        settings,
      };
    } catch (error) {
      console.error("Theme configuration error:", error.message);
      return null;
    }
  }

  // ================================
  // Build Theme Settings
  // ================================
  buildThemeSettings(content) {
    const settings = {};

    // Brand colors
    if (content.brand?.primaryColor) {
      settings.colors_primary = content.brand.primaryColor;
    }
    if (content.brand?.secondaryColor) {
      settings.colors_secondary = content.brand.secondaryColor;
    }

    return settings;
  }

  // ================================
  // Update Announcement Bar
  // ================================
  async updateAnnouncementBar(themeId, message) {
    const client = this.getRestClient();

    try {
      // Try to update announcement bar in theme sections
      const response = await client.get({
        path: `themes/${themeId}/assets`,
        query: { "asset[key]": "config/settings_data.json" },
      });

      const settings = JSON.parse(response.body.asset.value);
      const current = settings.current || {};

      // Update announcement text (varies by theme)
      if (current.sections?.announcement) {
        current.sections.announcement.settings = {
          ...current.sections.announcement.settings,
          text: message,
          show_announcement: true,
        };
      }

      settings.current = current;

      await client.put({
        path: `themes/${themeId}/assets`,
        data: {
          asset: {
            key: "config/settings_data.json",
            value: JSON.stringify(settings, null, 2),
          },
        },
      });
    } catch (error) {
      console.log("Could not update announcement bar:", error.message);
    }
  }

  // ================================
  // Create Pages
  // ================================
  async createPages(content) {
    const client = this.getRestClient();
    const pages = [];

    // Create FAQ page
    if (content.faq?.length > 0) {
      try {
        const faqHtml = this.buildFAQPageHTML(content.faq);
        const response = await client.post({
          path: "pages",
          data: {
            page: {
              title: "FAQ",
              body_html: faqHtml,
              published: true,
            },
          },
        });
        pages.push(response.body.page);
        console.log("  ✓ FAQ page created");
      } catch (error) {
        // Page might already exist
        console.log("  FAQ page skipped:", error.message);
      }
    }

    // Create About page
    if (content.brand?.story) {
      try {
        const aboutHtml = this.buildAboutPageHTML(content);
        const response = await client.post({
          path: "pages",
          data: {
            page: {
              title: "About Us",
              body_html: aboutHtml,
              published: true,
            },
          },
        });
        pages.push(response.body.page);
        console.log("  ✓ About page created");
      } catch (error) {
        console.log("  About page skipped:", error.message);
      }
    }

    return pages;
  }

  // ================================
  // Build FAQ Page HTML
  // ================================
  buildFAQPageHTML(faq) {
    let html = `
<div class="nova-faq" style="max-width: 800px; margin: 0 auto;">
  <style>
    .faq-item { border-bottom: 1px solid #eee; padding: 20px 0; }
    .faq-question { font-weight: 600; font-size: 1.1em; margin-bottom: 10px; }
    .faq-answer { color: #666; line-height: 1.6; }
  </style>
`;

    faq.forEach((item) => {
      html += `
  <div class="faq-item">
    <div class="faq-question">${item.question}</div>
    <div class="faq-answer">${item.answer}</div>
  </div>
`;
    });

    html += `</div>`;
    return html;
  }

  // ================================
  // Build About Page HTML
  // ================================
  buildAboutPageHTML(content) {
    const brand = content.brand || {};

    let html = `
<div class="nova-about" style="max-width: 800px; margin: 0 auto;">
  ${brand.tagline ? `<p style="font-size: 1.3em; color: #666; text-align: center; margin-bottom: 30px;">${brand.tagline}</p>` : ""}

  <div class="brand-story" style="line-height: 1.8; margin-bottom: 40px;">
    ${brand.story || ""}
  </div>
`;

    if (brand.values?.length > 0) {
      html += `
  <div class="brand-values" style="margin-top: 40px;">
    <h2 style="text-align: center; margin-bottom: 30px;">Our Values</h2>
    <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
      ${brand.values.map((value) => `<div style="text-align: center; padding: 20px;"><span style="font-size: 1.1em; font-weight: 500;">${value}</span></div>`).join("")}
    </div>
  </div>
`;
    }

    html += `</div>`;
    return html;
  }

  // ================================
  // Helper Methods
  // ================================
  extractProductType(title) {
    const types = [
      "Headphones",
      "Electronics",
      "Home & Garden",
      "Fashion",
      "Beauty",
      "Sports",
      "Toys",
      "Jewelry",
      "Accessories",
    ];

    const titleLower = title.toLowerCase();
    for (const type of types) {
      if (titleLower.includes(type.toLowerCase())) {
        return type;
      }
    }
    return "General";
  }

  generateTags(productData, content) {
    const tags = [];

    // Add SEO keywords as tags
    if (content.seo?.keywords) {
      tags.push(...content.seo.keywords.slice(0, 5));
    }

    // Add platform tag
    if (productData.platform) {
      tags.push(`imported-from-${productData.platform}`);
    }

    // Add Nova tag
    tags.push("nova-generated");

    return tags.join(", ");
  }
}

export default StoreBuilder;
