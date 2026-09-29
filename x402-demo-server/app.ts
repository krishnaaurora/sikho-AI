import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { morganMiddleware } from "./config/logger.config";
import routes from "./routes";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { appConfig } from "./config/app.config";
import { env } from "./config/env";

// Safely resolve the public directory (handles ts-node in dev and dist/ in production build)
const publicDir = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : path.resolve(process.cwd(), "public");

// ---------------------------------------------------------------------------
// Merchant branding constants for GoPlausible x402 dashboard enrichment.
// The facilitator scrapes the root URL (/) of your domain to read these tags.
// See: https://docs.goplausible.xyz/x402/merchant-branding
// ---------------------------------------------------------------------------
const MERCHANT = {
  name: "Sikho AI",
  siteName: "Sikho AI",
  description:
    "AI-powered micro-payment learning platform — unlock premium course chapters with USDC on Algorand via x402.",
  /** Full banner logo served from the backend domain */
  get logoUrl() {
    const baseUrl = env.PUBLIC_BACKEND_URL || env.PUBLIC_SITE_URL;
    return `${baseUrl}/logo.png`;
  },
  /** Square icon symbol served from the backend domain */
  get iconUrl() {
    const baseUrl = env.PUBLIC_BACKEND_URL || env.PUBLIC_SITE_URL;
    return `${baseUrl}/icon.png`;
  },
  /** Canonical site URL — driven by PUBLIC_SITE_URL env var */
  get siteUrl() { return env.PUBLIC_SITE_URL; },
  /** x402 discovery tags */
  tag: "x402-global-challenge",
  category: "education",
  network: "Algorand MainNet",
};

/**
 * Renders the merchant-branding HTML page served at GET /.
 * The GoPlausible facilitator and any OG-aware crawler will read:
 *   og:site_name  → Merchant Name on the dashboard
 *   og:title      → Fallback Merchant Name
 *   og:description → Merchant description
 *   og:image       → Merchant logo (must be a public HTTPS URL)
 */
function buildMerchantHtml(): string {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${MERCHANT.siteUrl}/#organization`,
        "name": MERCHANT.name,
        "url": MERCHANT.siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": MERCHANT.logoUrl,
          "contentUrl": MERCHANT.logoUrl,
          "caption": `${MERCHANT.name} Logo`
        },
        "image": MERCHANT.logoUrl,
        "description": MERCHANT.description
      },
      {
        "@type": "WebSite",
        "@id": `${MERCHANT.siteUrl}/#website`,
        "url": MERCHANT.siteUrl,
        "name": MERCHANT.name,
        "description": MERCHANT.description,
        "publisher": { "@id": `${MERCHANT.siteUrl}/#organization` }
      }
    ]
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Favicon and Icon definitions for GoPlausible facilitator & browser crawlers -->
  <link rel="icon" type="image/png" href="${MERCHANT.iconUrl}" />
  <link rel="shortcut icon" href="${MERCHANT.iconUrl}" />
  <link rel="apple-touch-icon" href="${MERCHANT.iconUrl}" />
  <link rel="image_src" href="${MERCHANT.logoUrl}" />

  <!-- Primary merchant identity — read by GoPlausible x402 facilitator -->
  <title>${MERCHANT.name}</title>
  <meta name="description" content="${MERCHANT.description}" />
  <meta name="logo" content="${MERCHANT.logoUrl}" />
  <meta name="image" content="${MERCHANT.logoUrl}" />

  <!-- Open Graph tags (merchant enrichment source for GoPlausible dashboard) -->
  <meta property="og:site_name" content="${MERCHANT.siteName}" />
  <meta property="og:title"     content="${MERCHANT.name}" />
  <meta property="og:description" content="${MERCHANT.description}" />
  <meta property="og:image"     content="${MERCHANT.logoUrl}" />
  <meta property="og:image:secure_url" content="${MERCHANT.logoUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${MERCHANT.name} Logo" />
  <meta property="og:url"       content="${MERCHANT.siteUrl}" />
  <meta property="og:type"      content="website" />

  <!-- Twitter Card tags -->
  <meta name="twitter:card"     content="summary_large_image" />
  <meta name="twitter:title"    content="${MERCHANT.name}" />
  <meta name="twitter:description" content="${MERCHANT.description}" />
  <meta name="twitter:image"    content="${MERCHANT.logoUrl}" />
  <meta name="twitter:image:alt" content="${MERCHANT.name} Logo" />

  <!-- x402 / Algorand Global Challenge discovery signals -->
  <meta name="x402:tag"      content="${MERCHANT.tag}" />
  <meta name="x402:network"  content="${MERCHANT.network}" />
  <meta name="x402:category" content="${MERCHANT.category}" />
  <meta name="x402:discovery" content="true" />
  <meta name="x402:merchant:name" content="${MERCHANT.name}" />
  <meta name="x402:merchant:site" content="${MERCHANT.siteUrl}" />
  <meta name="x402:merchant:logo" content="${MERCHANT.logoUrl}" />
  <meta name="x402:merchant:icon" content="${MERCHANT.iconUrl}" />

  <!-- Schema.org JSON-LD Structured Data for Crawlers & Facilitators -->
  <script type="application/ld+json">
    ${jsonLd}
  </script>

  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{text-align:center;padding:3rem 4rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1.5rem;backdrop-filter:blur(12px)}
    img.logo{max-width:220px;max-height:70px;object-fit:contain;margin-bottom:1.5rem;border-radius:.75rem;padding:.4rem 1rem;background:rgba(255,255,255,.06);border:1px solid rgba(99,102,241,.3)}
    h1{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#818cf8,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.75rem}
    p{color:#94a3b8;max-width:480px;line-height:1.6;margin-bottom:1.5rem}
    .badge{display:inline-flex;align-items:center;gap:.5rem;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);border-radius:2rem;padding:.35rem 1rem;font-size:.8rem;color:#818cf8}
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="${MERCHANT.logoUrl}" alt="${MERCHANT.name} logo" />
    <h1>${MERCHANT.name}</h1>
    <p>${MERCHANT.description}</p>
    <span class="badge">⛓ ${MERCHANT.tag} &nbsp;|&nbsp; 🎓 ${MERCHANT.category}</span>
  </div>
</body>
</html>`;
}

const app = express();

// Preserve the public HTTPS URL behind Render / any reverse proxy so the
// x402 challenge advertises a probeable public resource URL.
app.set("trust proxy", 1);

// Security and configuration middleware — allow images to be loaded cross-origin by GoPlausible dashboard
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ---------------------------------------------------------------------------
// Static assets — serves /logo.png, /icon.png (and any other files in public/) directly.
// Required so that `backend_url/logo.png` and `backend_url/icon.png` return HTTP 200 for GoPlausible
// merchant enrichment verification.
// ---------------------------------------------------------------------------
app.use(
  express.static(publicDir, {
    // Allow logo/icon to be fetched cross-origin (scrapers, dashboards, browsers)
    setHeaders(res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// Explicit route handlers for favicon & square icon requests (prevents 404s when crawlers probe these paths)
app.get(["/favicon.ico", "/favicon.png", "/apple-touch-icon.png", "/icon.png", "/logo-icon.png"], (req: Request, res: Response) => {
  const iconPath = path.join(publicDir, "icon.png");
  if (fs.existsSync(iconPath)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(iconPath);
  }
  return res.status(404).end();
});

app.get("/logo.png", (req: Request, res: Response) => {
  const logoPath = path.join(publicDir, "logo.png");
  if (fs.existsSync(logoPath)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(logoPath);
  }
  return res.status(404).end();
});

// ---------------------------------------------------------------------------
// Static serving of uploaded files (resumes, images, documents)
// Required so the frontend PDF viewer can display uploaded resumes via iframe.
// __dirname is dist/ in compiled mode, or src/ with ts-node.
// Multer saves to process.cwd()/uploads, so we resolve from project root.
// ---------------------------------------------------------------------------
const uploadsDir = path.resolve(process.cwd(), "uploads");
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders(res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
      // Allow this path to be embedded in iframes (helmet sets SAMEORIGIN globally,
      // which blocks the PDF viewer iframe when the frontend is on a different port).
      res.setHeader("X-Frame-Options", "ALLOWALL");
      // CSP frame-ancestors: allow any origin to embed these static files
      res.setHeader("Content-Security-Policy", "frame-ancestors *");
    },
  })
);
const allowedOrigins = appConfig.corsOrigin === "*"
  ? []
  : appConfig.corsOrigin.split(",").map(o => o.trim());

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);

    // Allow all if configured as wildcard, or if matching origin/vercel/localhost
    if (
      appConfig.corsOrigin === "*" ||
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("vercel.app") ||
      origin.includes("onrender.com")
    ) {
      return callback(null, true);
    }
    // Fallback: allow the origin rather than throwing an unhandled preflight 500 error
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Access-Control-Expose-Headers',
    'access-control-expose-headers',
    'Payment-Signature',
    'payment-signature',
    'X-Payment',
    'x-payment',
    'X-Payer',
    'x-payer',
    'PAYMENT-RESPONSE',
    'payment-response',
    'X-PAYMENT-RESPONSE',
    'x-payment-response',
    'PAYMENT-REQUIRED',
    'payment-required',
  ],
  exposedHeaders: [
    'X-PAYMENT-RESPONSE',
    'x-payment-response',
    'PAYMENT-REQUIRED',
    'payment-required',
    'PAYMENT-RESPONSE',
    'payment-response',
    'Access-Control-Expose-Headers',
  ],
};

app.use(cors(corsOptions));

// Explicit preflight handling to ensure all headers requested by browser are permitted
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqHeaders = req.headers["access-control-request-headers"];
  if (reqHeaders) {
    res.setHeader("Access-Control-Allow-Headers", reqHeaders);
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(morganMiddleware);

// ---------------------------------------------------------------------------
// Root route — merchant branding for GoPlausible x402 dashboard enrichment.
// Content-negotiated: HTML for browsers/crawlers, JSON for API clients.
// ---------------------------------------------------------------------------
app.get("/", (req: Request, res: Response) => {
  const acceptsJson =
    req.headers["accept"]?.includes("application/json") &&
    !req.headers["accept"]?.includes("text/html");

  if (acceptsJson) {
    // API clients / x402 tooling — return machine-readable discovery info
    return res.json({
      name: MERCHANT.name,
      description: MERCHANT.description,
      site: MERCHANT.siteUrl,
      backend: env.PUBLIC_BACKEND_URL,
      logo: MERCHANT.logoUrl,
      icon: MERCHANT.iconUrl,
      merchant: {
        name: MERCHANT.name,
        site: MERCHANT.siteUrl,
        backend: env.PUBLIC_BACKEND_URL,
        logo: MERCHANT.logoUrl,
        icon: MERCHANT.iconUrl,
        description: MERCHANT.description,
        category: MERCHANT.category,
      },
      x402: {
        tag: MERCHANT.tag,
        network: MERCHANT.network,
        category: MERCHANT.category,
        discovery: true,
      },
      api: `${env.PUBLIC_BACKEND_URL}${appConfig.apiPrefix}`,
    });
  }

  // Browsers and OG crawlers (including GoPlausible facilitator re-scrape)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(buildMerchantHtml());
});

// ---------------------------------------------------------------------------
// Standard AI Agent & Facilitator Discovery Endpoints
// ---------------------------------------------------------------------------
const discoveryHandler = (req: Request, res: Response) => {
  res.json({
    name: MERCHANT.name,
    description: MERCHANT.description,
    site: MERCHANT.siteUrl,
    backend: env.PUBLIC_BACKEND_URL,
    logo: MERCHANT.logoUrl,
    icon: MERCHANT.iconUrl,
    merchant: {
      name: MERCHANT.name,
      site: MERCHANT.siteUrl,
      backend: env.PUBLIC_BACKEND_URL,
      logo: MERCHANT.logoUrl,
      icon: MERCHANT.iconUrl,
      description: MERCHANT.description,
      category: MERCHANT.category,
    },
    x402: {
      tag: MERCHANT.tag,
      network: MERCHANT.network,
      category: MERCHANT.category,
      discovery: true,
    },
    api: `${env.PUBLIC_BACKEND_URL}${appConfig.apiPrefix}`,
  });
};

app.get(["/.well-known/x402", "/.well-known/x402.json", "/x402.json"], discoveryHandler);

app.get(["/bazaar.json", "/.well-known/bazaar.json"], (req: Request, res: Response) => {
  res.json({
    x402Version: 2,
    tag: MERCHANT.tag,
    network: MERCHANT.network,
    category: MERCHANT.category,
    merchant: {
      name: MERCHANT.name,
      site: MERCHANT.siteUrl,
      backend: env.PUBLIC_BACKEND_URL,
      logo: MERCHANT.logoUrl,
      icon: MERCHANT.iconUrl,
      description: MERCHANT.description,
    },
  });
});

app.get("/openapi.json", (req: Request, res: Response) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Sikho AI API",
      version: "1.0.0",
      description: MERCHANT.description,
    },
    servers: [
      { url: `${env.PUBLIC_BACKEND_URL}${appConfig.apiPrefix}`, description: "Production API" }
    ],
    paths: {},
  });
});

app.get(["/agents.json", "/agent-card.json", "/.well-known/agent-card.json", "/.well-known/agents.json"], (req: Request, res: Response) => {
  res.json({
    name: MERCHANT.name,
    description: MERCHANT.description,
    version: "1.0.0",
    url: MERCHANT.siteUrl,
    backendUrl: env.PUBLIC_BACKEND_URL,
    logo: MERCHANT.logoUrl,
    icon: MERCHANT.iconUrl,
    tag: MERCHANT.tag,
    category: MERCHANT.category,
    network: MERCHANT.network,
  });
});

app.get("/llms.txt", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`# Sikho AI\n\n${MERCHANT.description}\n\nSite: ${MERCHANT.siteUrl}\nAPI: ${env.PUBLIC_BACKEND_URL}${appConfig.apiPrefix}`);
});

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
