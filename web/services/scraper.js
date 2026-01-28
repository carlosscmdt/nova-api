// ================================
// Nova - Product Scraper Service
// Scrapes products from AliExpress, Amazon, Alibaba
// ================================

import axios from "axios";
import * as cheerio from "cheerio";

export class ProductScraper {
  constructor() {
    this.userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }

  // ================================
  // Main Scrape Method
  // ================================
  async scrape(url) {
    const platform = this.detectPlatform(url);
    console.log(`🔍 Scraping ${platform}: ${url}`);

    try {
      let result;
      switch (platform) {
        case "aliexpress":
          result = await this.scrapeAliExpress(url);
          break;
        case "amazon":
          result = await this.scrapeAmazon(url);
          break;
        case "alibaba":
          result = await this.scrapeAlibaba(url);
          break;
        default:
          result = await this.scrapeGeneric(url);
      }

      // Check if we got valid data
      if (!result.title || result.title.includes("404") || result.title.length < 5 || result.price === 0) {
        console.log("⚠️ Invalid data, using demo product");
        return this.getDemoProduct(url, platform);
      }

      return result;
    } catch (error) {
      console.error(`Scrape failed: ${error.message}`);
      return this.getDemoProduct(url, platform);
    }
  }

  // ================================
  // Demo Product
  // ================================
  getDemoProduct(url, platform) {
    console.log("📦 Using demo product data");
    return {
      platform,
      url,
      title: "Premium Wireless Bluetooth Earbuds Pro",
      price: 49.99,
      originalPrice: 129.99,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
        "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80",
        "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      ],
      description: "Experience premium sound quality with our latest wireless earbuds featuring advanced active noise cancellation.",
      bullets: [
        "Active Noise Cancellation blocks 98% of ambient noise",
        "40-hour total battery life with wireless charging case",
        "Premium 12mm audio drivers for rich sound",
        "IPX5 water & sweat resistant",
        "Touch controls for music & calls",
        "Bluetooth 5.3 connectivity",
      ],
      variants: [
        { name: "Color", options: [{ name: "Midnight Black" }, { name: "Pearl White" }, { name: "Rose Gold" }] },
      ],
      specifications: [
        { key: "Battery Life", value: "8 hours (40 with case)" },
        { key: "Bluetooth", value: "5.3" },
        { key: "Driver Size", value: "12mm" },
        { key: "Water Resistance", value: "IPX5" },
      ],
      rating: 4.8,
      reviewCount: 12847,
      scrapedAt: new Date().toISOString(),
      isDemo: true,
    };
  }

  // ================================
  // Platform Detection
  // ================================
  detectPlatform(url) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes("aliexpress.")) return "aliexpress";
    if (urlLower.includes("amazon.")) return "amazon";
    if (urlLower.includes("alibaba.com")) return "alibaba";
    if (urlLower.includes("1688.com")) return "1688";
    if (urlLower.includes("cjdropshipping.com")) return "cj";

    return "generic";
  }

  // ================================
  // AliExpress Scraper
  // ================================
  async scrapeAliExpress(url) {
    // Extract product ID
    const productIdMatch = url.match(/\/item\/(\d+)\.html/) ||
                          url.match(/\/(\d+)\.html/) ||
                          url.match(/item\/(\d+)/);
    const productId = productIdMatch ? productIdMatch[1] : null;

    // Try mobile API (less protected)
    if (productId) {
      try {
        const apiData = await this.scrapeAliExpressAPI(productId);
        if (apiData && apiData.title) {
          return apiData;
        }
      } catch (e) {
        console.log("API method failed, trying HTML scrape");
      }
    }

    // Fallback to HTML scraping
    const response = await axios.get(url, {
      headers: {
        "User-Agent": this.userAgent,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Extract from page data
    let pageData = null;
    $("script").each((i, script) => {
      const content = $(script).html() || "";

      // Try different data patterns
      const patterns = [
        /window\.runParams\s*=\s*(\{[\s\S]*?\});/,
        /data:\s*(\{[\s\S]*?"actionModule"[\s\S]*?\})/,
        /__INIT_DATA__\s*=\s*(\{[\s\S]*?\});/,
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            pageData = JSON.parse(match[1]);
            break;
          } catch (e) {}
        }
      }
    });

    // Extract title
    let title =
      pageData?.pageModule?.title ||
      pageData?.titleModule?.subject ||
      $("h1").first().text().trim() ||
      $('[data-pl="product-title"]').text().trim() ||
      $("title").text().split("-")[0].trim();

    // Extract price
    let price = "0.00";
    let originalPrice = null;

    if (pageData?.priceModule) {
      price = pageData.priceModule.minActivityAmount?.value ||
              pageData.priceModule.minAmount?.value ||
              pageData.priceModule.formatedActivityPrice?.replace(/[^\d.]/g, "");
      originalPrice = pageData.priceModule.minAmount?.value;
    }

    // Try regex on HTML
    if (price === "0.00") {
      const priceMatch = response.data.match(/US\s*\$\s*([\d.,]+)/);
      if (priceMatch) price = priceMatch[1];
    }

    // Extract images
    const images = [];

    // From page data
    if (pageData?.imageModule?.imagePathList) {
      pageData.imageModule.imagePathList.forEach((img) => {
        const imgUrl = img.startsWith("//") ? `https:${img}` : img;
        if (!images.includes(imgUrl)) images.push(imgUrl);
      });
    }

    // From HTML
    $("img").each((i, img) => {
      const src = $(img).attr("src") || $(img).data("src") || "";
      if (src.includes("alicdn.com") && src.includes("http") && !images.includes(src)) {
        const largeSrc = src.replace(/_\d+x\d+\.(jpg|png|webp)/gi, ".$1");
        if (!images.includes(largeSrc)) images.push(largeSrc);
      }
    });

    // Extract description
    let description = "";
    if (pageData?.descriptionModule?.descriptionUrl) {
      try {
        const descResp = await axios.get(pageData.descriptionModule.descriptionUrl);
        description = descResp.data;
      } catch (e) {}
    }

    // Extract variants/SKU
    const variants = [];
    if (pageData?.skuModule?.productSKUPropertyList) {
      pageData.skuModule.productSKUPropertyList.forEach((prop) => {
        const variant = {
          name: prop.skuPropertyName,
          options: prop.skuPropertyValues.map((v) => ({
            name: v.propertyValueDisplayName,
            image: v.skuPropertyImagePath
              ? `https:${v.skuPropertyImagePath}`
              : null,
          })),
        };
        variants.push(variant);
      });
    }

    // Extract specs
    const specifications = [];
    if (pageData?.specsModule?.props) {
      pageData.specsModule.props.forEach((prop) => {
        specifications.push({
          key: prop.attrName,
          value: prop.attrValue,
        });
      });
    }

    return {
      platform: "aliexpress",
      productId,
      url,
      title: title || "Product",
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      currency: "USD",
      images: images.slice(0, 15),
      description,
      variants,
      specifications,
      scrapedAt: new Date().toISOString(),
    };
  }

  // ================================
  // AliExpress API Method
  // ================================
  async scrapeAliExpressAPI(productId) {
    // Mobile API endpoint (less protected)
    const apiUrl = `https://m.aliexpress.com/api/detail/v1/item/${productId}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    const data = response.data;

    if (!data || !data.item) {
      throw new Error("No data from API");
    }

    const item = data.item;

    return {
      platform: "aliexpress",
      productId,
      title: item.title,
      price: parseFloat(item.sku?.def?.promotionPrice || item.sku?.def?.price || 0),
      originalPrice: parseFloat(item.sku?.def?.price || 0),
      currency: "USD",
      images: item.images || [],
      description: item.description || "",
      variants: [],
      specifications: [],
      scrapedAt: new Date().toISOString(),
    };
  }

  // ================================
  // Amazon Scraper
  // ================================
  async scrapeAmazon(url) {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": this.userAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim() || $("h1").first().text().trim();

    // Price extraction
    let price = "0.00";
    const priceSelectors = [
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price-whole",
      '[data-a-color="price"] .a-offscreen',
    ];

    for (const selector of priceSelectors) {
      const priceEl = $(selector).first().text();
      if (priceEl) {
        price = priceEl.replace(/[^\d.,]/g, "");
        break;
      }
    }

    // Images
    const images = [];

    // Main image
    const mainImg = $("#landingImage").attr("src") || $("#imgBlkFront").attr("src");
    if (mainImg) images.push(mainImg.replace(/\._.*_\./, "."));

    // Thumbnail images
    $("#altImages img, .imageThumbnail img").each((i, img) => {
      let src = $(img).attr("src") || $(img).data("old-hires");
      if (src) {
        src = src.replace(/\._.*_\./, ".");
        if (!images.includes(src)) images.push(src);
      }
    });

    // Try JSON data
    $("script").each((i, script) => {
      const content = $(script).html() || "";
      if (content.includes("colorImages")) {
        const match = content.match(/'colorImages'\s*:\s*(\{[\s\S]*?\})\s*,\s*'/);
        if (match) {
          try {
            const imgData = JSON.parse(match[1].replace(/'/g, '"'));
            if (imgData.initial) {
              imgData.initial.forEach((img) => {
                if (img.hiRes && !images.includes(img.hiRes)) {
                  images.push(img.hiRes);
                }
              });
            }
          } catch (e) {}
        }
      }
    });

    // Bullet points
    const bullets = [];
    $("#feature-bullets li span").each((i, el) => {
      const text = $(el).text().trim();
      if (text) bullets.push(text);
    });

    // Description
    const description =
      $("#productDescription").html() || bullets.join("\n") || "";

    // Variants
    const variants = [];
    $("#variation_color_name, #variation_size_name").each((i, el) => {
      const name = $(el).find(".a-form-label").text().trim().replace(":", "");
      const options = [];

      $(el)
        .find("li")
        .each((j, opt) => {
          const optName =
            $(opt).attr("title")?.replace("Click to select ", "") ||
            $(opt).text().trim();
          const optImg = $(opt).find("img").attr("src");
          if (optName) options.push({ name: optName, image: optImg });
        });

      if (name && options.length) variants.push({ name, options });
    });

    // Rating
    const ratingText = $("#acrPopover").attr("title") || "";
    const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || "0");

    const reviewCountText = $("#acrCustomerReviewText").text() || "";
    const reviewCount = parseInt(
      reviewCountText.replace(/[^\d]/g, "") || "0",
      10
    );

    return {
      platform: "amazon",
      url,
      title,
      price: parseFloat(price) || 0,
      currency: "USD",
      images: images.slice(0, 15),
      description,
      bullets,
      variants,
      specifications: [],
      rating,
      reviewCount,
      scrapedAt: new Date().toISOString(),
    };
  }

  // ================================
  // Alibaba Scraper
  // ================================
  async scrapeAlibaba(url) {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": this.userAgent,
        Accept: "text/html",
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);

    const title =
      $(".module-pdp-title, .ma-title, h1").first().text().trim() ||
      $("title").text().split("-")[0].trim();

    const priceText = $(".module-pdp-price, .ma-spec-price").first().text();
    const priceMatch = priceText.match(/[\d.,]+/);
    const price = priceMatch ? priceMatch[0] : "0.00";

    const images = [];
    $(".main-image-wrapper img, .detail-gallery img, .image-container img").each(
      (i, img) => {
        const src = $(img).attr("src") || $(img).data("src");
        if (src && !images.includes(src)) {
          images.push(src.startsWith("//") ? `https:${src}` : src);
        }
      }
    );

    const moqText = $(".module-pdp-moq, .ma-min-order").text();
    const moq = parseInt(moqText.match(/\d+/)?.[0] || "1", 10);

    return {
      platform: "alibaba",
      url,
      title,
      price: parseFloat(price.replace(",", "")) || 0,
      currency: "USD",
      images: images.slice(0, 15),
      description: $(".product-description, .do-entry-item").html() || "",
      variants: [],
      specifications: [],
      moq,
      scrapedAt: new Date().toISOString(),
    };
  }

  // ================================
  // Generic Website Scraper
  // ================================
  async scrapeGeneric(url) {
    const response = await axios.get(url, {
      headers: { "User-Agent": this.userAgent },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const title =
      $("h1").first().text().trim() ||
      $('[itemprop="name"]').first().text().trim() ||
      $("title").text().trim();

    const images = [];
    $('[itemprop="image"], .product-image img, .gallery img, img').each(
      (i, img) => {
        let src = $(img).attr("src") || $(img).data("src");
        if (src && !src.startsWith("data:")) {
          if (!src.startsWith("http")) {
            src = new URL(src, url).href;
          }
          if (!images.includes(src)) images.push(src);
        }
      }
    );

    const priceText =
      $('[itemprop="price"]').attr("content") || $(".price").first().text();
    const priceMatch = priceText?.match(/[\d.,]+/);
    const price = priceMatch ? priceMatch[0] : "0.00";

    return {
      platform: "generic",
      url,
      title,
      price: parseFloat(price.replace(",", "")) || 0,
      currency: "USD",
      images: images.slice(0, 15),
      description: $('[itemprop="description"]').html() || "",
      variants: [],
      specifications: [],
      scrapedAt: new Date().toISOString(),
    };
  }

  // ================================
  // Fallback Scraper (Uses external service)
  // ================================
  async scrapeFallback(url, platform) {
    // If you have ScraperAPI or similar, use it here
    // For now, return a demo product for testing

    console.log("📦 Using demo data (external scraper not configured)");

    return {
      platform,
      url,
      title: "Premium Wireless Earbuds - Active Noise Cancelling",
      price: 49.99,
      originalPrice: 99.99,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
        "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800",
        "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800",
      ],
      description:
        "Experience crystal-clear audio with our premium wireless earbuds featuring active noise cancellation.",
      bullets: [
        "Active Noise Cancellation",
        "40-hour battery life with charging case",
        "Premium audio drivers",
        "IPX5 water resistant",
        "Touch controls",
        "Wireless charging compatible",
      ],
      variants: [
        {
          name: "Color",
          options: [
            { name: "Midnight Black" },
            { name: "Pearl White" },
            { name: "Rose Gold" },
          ],
        },
      ],
      specifications: [
        { key: "Battery Life", value: "8 hours (40 with case)" },
        { key: "Bluetooth", value: "5.3" },
        { key: "Driver Size", value: "12mm" },
        { key: "Noise Cancellation", value: "Active (ANC)" },
        { key: "Water Resistance", value: "IPX5" },
      ],
      rating: 4.8,
      reviewCount: 3247,
      scrapedAt: new Date().toISOString(),
      isDemo: true,
    };
  }
}

export default ProductScraper;
