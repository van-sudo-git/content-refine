import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const results: Record<string, unknown> = {};

  await page.goto("https://nowweseeyou.org/gallery/brad-fisher", { waitUntil: "networkidle" });
  results.bradSeo = {
    title: await page.title(),
    ogTitle: await page.locator('meta[property="og:title"]').first().getAttribute("content"),
    twitterCard: await page.locator('meta[name="twitter:card"]').first().getAttribute("content"),
    canonical: await page.locator('link[rel="canonical"]').first().getAttribute("href"),
jsonLd: await page.locator('script[type="application/ld+json"]').first().textContent(),
    overflowX: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  };

  await page.goto("https://nowweseeyou.org/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  results.adminUnauthenticated = {
    url: page.url(),
    redirectedToLogin: page.url().includes("/admin/login"),
  };

  await page.goto("https://nowweseeyou.org/admin?demo=true", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  results.adminDemo = {
    url: page.url(),
    hasAnalyticsTab: (await page.getByText("Analytics", { exact: false }).count()) > 0,
    hasDemoContent: (await page.getByText("Demo", { exact: false }).count()) > 0,
  };

  await page.goto("https://nowweseeyou.org/nominate", { waitUntil: "networkidle" });
  results.nominatePage = {
    url: page.url(),
    hasSubmit: (await page.getByRole("button", { name: /submit/i }).count()) > 0,
  };

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
