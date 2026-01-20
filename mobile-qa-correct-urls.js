const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://nwestco-v1-5.tandemtheory.com';
const SCREENSHOT_DIR = './qa-mobile-screenshots';

// CORRECTED page list based on actual file structure
const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about.html' },
  { name: 'careers', path: '/careers.html' },
  { name: 'contact', path: '/contact.html' },
  { name: 'financing', path: '/financing.html' },
  { name: 'locations', path: '/locations.html' },
  { name: 'projects', path: '/projects.html' },
  { name: 'news', path: '/news.html' },
  // Markets
  { name: 'market-fuel-systems', path: '/markets/fuel-systems.html' },
  { name: 'market-car-wash', path: '/markets/car-wash.html' },
  { name: 'market-environmental', path: '/markets/environmental.html' },
  // Services - CORRECTED NAMES
  { name: 'service-design-engineering', path: '/services/design-engineering.html' },
  { name: 'service-installation', path: '/services/installation.html' },
  { name: 'service-maintenance', path: '/services/service-maintenance.html' },
  { name: 'service-remodels', path: '/services/remodels-upgrades.html' },
  { name: 'service-equipment', path: '/services/equipment-parts.html' },
  { name: 'service-testing', path: '/services/testing-compliance.html' },
  { name: 'service-training', path: '/services/training.html' },
  // Legal
  { name: 'legal-privacy', path: '/legal/privacy.html' },
  { name: 'legal-terms', path: '/legal/terms.html' },
  { name: 'legal-accessibility', path: '/legal/accessibility.html' },
  // News articles - CORRECTED
  { name: 'news-arkoma', path: '/news/arkoma-acquisition.html' },
  { name: 'news-able-cleanup', path: '/news/able-cleanup-acquisition.html' },
  { name: 'news-palmetto', path: '/news/palmetto-acquisition.html' },
];

async function testMobileMenu(page) {
  const results = {
    hamburgerVisible: false,
    menuOpens: false,
    menuCloses: false,
    linksClickable: false
  };

  try {
    // Check hamburger is visible
    const hamburger = await page.$('.mobile-menu-toggle');
    if (hamburger) {
      const isVisible = await hamburger.isVisible();
      results.hamburgerVisible = isVisible;

      if (isVisible) {
        // Click hamburger
        await hamburger.click();
        await page.waitForTimeout(500);

        // Check if fullscreen menu is visible
        const menu = await page.$('#fullscreen-menu');
        if (menu) {
          const menuVisible = await page.evaluate(() => {
            const menu = document.getElementById('fullscreen-menu');
            return menu && !menu.getAttribute('aria-hidden');
          });
          results.menuOpens = menuVisible;

          // Screenshot menu open
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'mobile-menu-open.png'),
            fullPage: false
          });

          // Try to close menu
          const closeBtn = await page.$('.menu-close');
          if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(300);
            const menuClosed = await page.evaluate(() => {
              const menu = document.getElementById('fullscreen-menu');
              return menu && menu.getAttribute('aria-hidden') === 'true';
            });
            results.menuCloses = menuClosed;
          }
        }
      }
    }
  } catch (e) {
    results.error = e.message;
  }

  return results;
}

async function runTests() {
  console.log('Starting Mobile QA Tests with Corrected URLs...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  // First test - mobile menu functionality on homepage
  console.log('Testing Mobile Menu...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const menuResults = await testMobileMenu(page);
  console.log('Menu Results:', JSON.stringify(menuResults, null, 2));

  // Test each page for 404s and basic mobile issues
  const results = [];
  for (const pageInfo of PAGES) {
    console.log(`Testing: ${pageInfo.name}...`);
    try {
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response ? response.status() : 'no response';
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      results.push({
        name: pageInfo.name,
        url: `${BASE_URL}${pageInfo.path}`,
        status: status,
        hasHorizontalScroll: hasHorizontalScroll
      });

      if (status !== 200) {
        console.log(`  WARNING: ${status}`);
      }
    } catch (e) {
      results.push({
        name: pageInfo.name,
        url: `${BASE_URL}${pageInfo.path}`,
        error: e.message
      });
      console.log(`  ERROR: ${e.message}`);
    }
  }

  await browser.close();

  // Print summary
  console.log('\n========================================');
  console.log('CORRECTED URL TEST RESULTS');
  console.log('========================================');

  const failures = results.filter(r => r.status !== 200 || r.error);
  const horizontalScrollIssues = results.filter(r => r.hasHorizontalScroll);

  console.log(`Total Pages: ${results.length}`);
  console.log(`Successful (200): ${results.filter(r => r.status === 200).length}`);
  console.log(`Failed/404: ${failures.length}`);
  console.log(`Horizontal Scroll Issues: ${horizontalScrollIssues.length}`);

  if (failures.length > 0) {
    console.log('\nFailed Pages:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.status || f.error}`));
  }

  if (horizontalScrollIssues.length > 0) {
    console.log('\nHorizontal Scroll Issues:');
    horizontalScrollIssues.forEach(h => console.log(`  - ${h.name}`));
  }

  console.log('\nMobile Menu Test:');
  console.log(`  Hamburger Visible: ${menuResults.hamburgerVisible}`);
  console.log(`  Menu Opens: ${menuResults.menuOpens}`);
  console.log(`  Menu Closes: ${menuResults.menuCloses}`);

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'corrected-url-results.json'),
    JSON.stringify({ menuResults, pageResults: results }, null, 2)
  );
}

runTests().catch(console.error);
