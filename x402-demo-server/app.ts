import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { morganMiddleware } from "./config/logger.config";
import routes from "./routes";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { appConfig } from "./config/app.config";
import { env } from "./config/env";

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
  /** Logo served from the Vercel deployment — driven by PUBLIC_SITE_URL env var */
  get logoUrl() { return `${env.PUBLIC_SITE_URL}/logo.png`; },
  /** Canonical site URL — driven by PUBLIC_SITE_URL env var (set to Vercel domain) */
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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary merchant identity — read by GoPlausible x402 facilitator -->
  <title>${MERCHANT.name}</title>
  <meta name="description" content="${MERCHANT.description}" />

  <!-- Open Graph tags (merchant enrichment source for GoPlausible dashboard) -->
  <meta property="og:site_name" content="${MERCHANT.siteName}" />
  <meta property="og:title"     content="${MERCHANT.name}" />
  <meta property="og:description" content="${MERCHANT.description}" />
  <meta property="og:image"     content="${MERCHANT.logoUrl}" />
  <meta property="og:url"       content="${MERCHANT.siteUrl}" />
  <meta property="og:type"      content="website" />

  <!-- x402 / Algorand Global Challenge discovery signals -->
  <meta name="x402:tag"      content="${MERCHANT.tag}" />
  <meta name="x402:network"  content="${MERCHANT.network}" />
  <meta name="x402:category" content="${MERCHANT.category}" />
  <meta name="x402:discovery" content="true" />

  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{text-align:center;padding:3rem 4rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1.5rem;backdrop-filter:blur(12px)}
    img.logo{width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:1.5rem;border:3px solid rgba(99,102,241,.6)}
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

// Security and configuration middleware
app.use(helmet());

// ---------------------------------------------------------------------------
// Static assets — serves /logo.png (and any other files in public/) directly.
// Required so that `backend_url/logo.png` returns HTTP 200 for GoPlausible
// merchant enrichment verification.
// ---------------------------------------------------------------------------
app.use(
  express.static(path.join(__dirname, "public"), {
    // Allow logo to be fetched cross-origin (scrapers, dashboards, browsers)
    setHeaders(res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);
const allowedOrigins = appConfig.corsOrigin === "*"
  ? []
  : appConfig.corsOrigin.split(",").map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || appConfig.corsOrigin === "*" || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-PAYMENT', 'PAYMENT-SIGNATURE', 'Access-Control-Expose-Headers'],
  exposedHeaders: ['X-PAYMENT-RESPONSE', 'Access-Control-Expose-Headers', 'PAYMENT-REQUIRED', 'PAYMENT-RESPONSE'],
}));
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
      logo: MERCHANT.logoUrl,
      site: MERCHANT.siteUrl,
      x402: {
        tag: MERCHANT.tag,
        network: MERCHANT.network,
        category: MERCHANT.category,
        discovery: true,
      },
      api: `${MERCHANT.siteUrl}${appConfig.apiPrefix}`,
    });
  }

  // Browsers and OG crawlers (including GoPlausible facilitator re-scrape)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(buildMerchantHtml());
});

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
