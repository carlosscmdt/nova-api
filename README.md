# Nova AI Store Builder - Shopify Embedded App

Transform any product link into a premium, conversion-optimized Shopify store in seconds.

## Features

- **Product Scraping**: Extract product data from AliExpress, Amazon, Alibaba, CJ Dropshipping
- **AI Content Generation**: Claude generates compelling copy, brand identity, and SEO
- **Premium Theme Sections**: Modern, conversion-optimized Liquid sections
- **One-Click Deploy**: Creates products, uploads images, configures themes in Shopify

## Project Structure

```
nova-shopify-app/
├── shopify.app.toml          # Shopify app configuration
├── .env                      # Environment variables
├── web/
│   ├── index.js              # Express server with Shopify auth
│   ├── package.json          # Backend dependencies
│   ├── services/
│   │   ├── scraper.js        # Product scraping service
│   │   ├── ai-generator.js   # Claude AI content generation
│   │   └── store-builder.js  # Shopify store creation
│   └── frontend/
│       ├── src/              # React + Polaris UI
│       └── package.json      # Frontend dependencies
└── extensions/
    └── nova-theme/           # Shopify theme extension
        ├── sections/         # Premium Liquid sections
        └── assets/           # CSS files
```

## Getting Started

### Prerequisites

- Node.js 18+
- Shopify Partner account
- Development store
- Anthropic API key

### Installation

1. **Install dependencies**

```bash
# Backend
cd web && npm install

# Frontend
cd frontend && npm install && npm run build
cd ..
```

2. **Configure .env**

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
ANTHROPIC_API_KEY=your_anthropic_key
SCOPES=read_products,write_products,read_themes,write_themes,read_content,write_content
HOST=https://your-tunnel-url.ngrok.io
PORT=3000
```

3. **Start the app**

```bash
# Using Shopify CLI (recommended)
shopify app dev

# Or manually
cd web && npm run dev
```

4. **Install on development store**

Visit your app URL in the Shopify admin to install and authenticate.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/scrape` | POST | Scrape product from URL |
| `/api/generate` | POST | Generate AI content |
| `/api/build-store` | POST | Create product & configure store |
| `/api/shop` | GET | Get shop information |
| `/api/products` | GET | List products |

## Theme Sections

The app includes premium Liquid sections:

- **Nova Hero**: Conversion-optimized hero section with stats, trust badges
- **Nova Testimonials**: Social proof section with reviews
- **Nova Features**: Feature grid with icons
- **Nova Product Showcase**: Premium product display

## Tech Stack

- **Backend**: Node.js, Express, Shopify App Express
- **Frontend**: React, Shopify Polaris, Vite
- **AI**: Claude (Anthropic)
- **Scraping**: Axios, Cheerio
- **Database**: SQLite (sessions)

## License

MIT
