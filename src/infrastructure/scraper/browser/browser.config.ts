import type { LaunchOptions } from 'puppeteer';

// Pool of realistic user agents
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

// Chromium executable path
export const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

export interface BrowserInstance {
  browser: import('puppeteer').Browser;
  page: import('puppeteer').Page;
}

export function buildBrowserLaunchOptions(proxyUrl?: string): LaunchOptions {
  const args = [
    // Basic flags
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',

    // Stealth flags (from Latenode article)
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-infobars',
    '--disable-web-security',

    // Performance & stability
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--disable-background-networking',
    '--disable-software-rasterizer',
    '--disable-extensions',

    // Window & display
    '--window-size=1920,1080',
    '--start-maximized',

    // Language
    '--lang=ru-RU,ru',
    '--accept-lang=ru-RU,ru;q=0.9',

    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',

    // Additional stability
    '--disable-crash-reporter',
    '--disable-in-process-stack-traces',
  ];

  // Add proxy from parameter (residential proxy)
  if (proxyUrl) {
    args.push(`--proxy-server=${proxyUrl}`);
  }

  return {
    executablePath: CHROMIUM_PATH,
    headless: false, // Use Xvfb for better stability with Cloudflare
    args,
    defaultViewport: null, // Will be set per-page for randomization
  };
}
