const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://nwestco-v1-5.tandemtheory.com';
const SCREENSHOT_DIR = './qa-mobile-screenshots';

// All pages to test
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
  // Services
  { name: 'service-construction', path: '/services/construction.html' },
  { name: 'service-compliance', path: '/services/compliance.html' },
  { name: 'service-service-maintenance', path: '/services/service-maintenance.html' },
  { name: 'service-emergency', path: '/services/emergency.html' },
  { name: 'service-equipment-sales', path: '/services/equipment-sales.html' },
  { name: 'service-testing', path: '/services/testing.html' },
  { name: 'service-fleet-fueling', path: '/services/fleet-fueling.html' },
  // Legal
  { name: 'legal-privacy', path: '/legal/privacy.html' },
  { name: 'legal-terms', path: '/legal/terms.html' },
  { name: 'legal-accessibility', path: '/legal/accessibility.html' },
  // News articles
  { name: 'news-new-office', path: '/news/new-office-location.html' },
  { name: 'news-industry-award', path: '/news/industry-award.html' },
  { name: 'news-epa-regulations', path: '/news/new-epa-regulations.html' },
  { name: 'news-partnership', path: '/news/partnership-announcement.html' },
];

const results = {
  timestamp: new Date().toISOString(),
  viewport: { width: 375, height: 812 },
  baseUrl: BASE_URL,
  pages: [],
  issues: [],
  summary: {}
};

async function testPage(page, pageInfo) {
  const pageResult = {
    name: pageInfo.name,
    url: `${BASE_URL}${pageInfo.path}`,
    tests: {},
    issues: []
  };

  try {
    // Navigate to page
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    pageResult.tests.pageLoads = response && response.status() === 200;

    if (!pageResult.tests.pageLoads) {
      pageResult.issues.push({
        type: 'CRITICAL',
        description: `Page failed to load: HTTP ${response ? response.status() : 'no response'}`
      });
      return pageResult;
    }

    // Wait for content
    await page.waitForTimeout(1000);

    // Screenshot full page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${pageInfo.name}-mobile.png`),
      fullPage: true
    });

    // Test 1: Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    pageResult.tests.noHorizontalScroll = !hasHorizontalScroll;
    if (hasHorizontalScroll) {
      pageResult.issues.push({
        type: 'CRITICAL',
        description: 'Horizontal scrolling detected - content overflows viewport'
      });
    }

    // Test 2: Check hamburger menu exists and is visible
    const hamburgerMenu = await page.$('button[aria-label*="menu"], .hamburger, .mobile-menu-btn, [data-mobile-menu], button.md\\:hidden, .menu-toggle');
    pageResult.tests.hamburgerExists = !!hamburgerMenu;
    if (!hamburgerMenu) {
      // Check for any mobile menu trigger
      const mobileNav = await page.$('.mobile-nav, .mobile-menu, nav button');
      pageResult.tests.hamburgerExists = !!mobileNav;
    }
    if (!pageResult.tests.hamburgerExists) {
      pageResult.issues.push({
        type: 'HIGH',
        description: 'Mobile hamburger menu not found or not visible'
      });
    }

    // Test 3: Test hamburger menu functionality
    if (pageResult.tests.hamburgerExists) {
      try {
        const menuButton = await page.$('header button, nav button, .mobile-menu-btn, button[aria-expanded]');
        if (menuButton) {
          await menuButton.click();
          await page.waitForTimeout(500);

          // Screenshot menu open state
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `${pageInfo.name}-mobile-menu-open.png`),
            fullPage: false
          });

          // Check if menu opened
          const menuVisible = await page.evaluate(() => {
            const navLinks = document.querySelectorAll('nav a, .mobile-nav a, .nav-links a');
            for (const link of navLinks) {
              const rect = link.getBoundingClientRect();
              const style = window.getComputedStyle(link);
              if (rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
                return true;
              }
            }
            return false;
          });
          pageResult.tests.menuOpens = menuVisible;

          // Close menu
          await menuButton.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        pageResult.tests.menuOpens = 'error';
        pageResult.issues.push({
          type: 'MEDIUM',
          description: `Menu interaction error: ${e.message}`
        });
      }
    }

    // Test 4: Check text readability (minimum font size)
    const smallTextElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, li, a, td, th, label');
      const smallTexts = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 14 && el.textContent.trim().length > 0) {
          smallTexts.push({
            tag: el.tagName,
            fontSize: fontSize,
            text: el.textContent.trim().substring(0, 50)
          });
        }
      });
      return smallTexts.slice(0, 10); // First 10 examples
    });
    pageResult.tests.textReadable = smallTextElements.length === 0;
    if (smallTextElements.length > 0) {
      pageResult.issues.push({
        type: 'MEDIUM',
        description: `Found ${smallTextElements.length}+ elements with font-size < 14px`,
        details: smallTextElements
      });
    }

    // Test 5: Check button tap targets (minimum 44x44)
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a.btn, .button, [role="button"], input[type="submit"]');
      const small = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if ((rect.width < 44 || rect.height < 44) && rect.width > 0) {
          small.push({
            text: btn.textContent.trim().substring(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      return small.slice(0, 5);
    });
    pageResult.tests.tappableButtons = smallButtons.length === 0;
    if (smallButtons.length > 0) {
      pageResult.issues.push({
        type: 'MEDIUM',
        description: `Found ${smallButtons.length}+ buttons smaller than 44x44px tap target`,
        details: smallButtons
      });
    }

    // Test 6: Check hero section sizing
    const heroInfo = await page.evaluate(() => {
      const hero = document.querySelector('.hero, [class*="hero"], section:first-of-type');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        return {
          exists: true,
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          viewportHeight: window.innerHeight
        };
      }
      return { exists: false };
    });
    pageResult.tests.heroSection = heroInfo;
    if (heroInfo.exists && heroInfo.height < 200) {
      pageResult.issues.push({
        type: 'LOW',
        description: `Hero section may be too short on mobile: ${heroInfo.height}px`
      });
    }

    // Test 7: Check images have proper sizing
    const oversizedImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const oversized = [];
      images.forEach(img => {
        if (img.naturalWidth > 0 && img.width > window.innerWidth) {
          oversized.push({
            src: img.src.substring(img.src.lastIndexOf('/') + 1),
            displayWidth: img.width,
            viewportWidth: window.innerWidth
          });
        }
      });
      return oversized;
    });
    pageResult.tests.imagesProperlyScaled = oversizedImages.length === 0;
    if (oversizedImages.length > 0) {
      pageResult.issues.push({
        type: 'HIGH',
        description: `${oversizedImages.length} image(s) overflow viewport width`,
        details: oversizedImages
      });
    }

    // Test 8: Check card/grid stacking
    const gridInfo = await page.evaluate(() => {
      const grids = document.querySelectorAll('.grid, [class*="grid"], .cards, [class*="card-"]');
      const issues = [];
      grids.forEach((grid, i) => {
        const style = window.getComputedStyle(grid);
        const children = grid.children;
        if (children.length > 1) {
          const firstChild = children[0].getBoundingClientRect();
          const secondChild = children[1].getBoundingClientRect();
          // Check if items are side by side on mobile (shouldn't be)
          if (Math.abs(firstChild.top - secondChild.top) < 20 && firstChild.width < 200) {
            issues.push({
              gridIndex: i,
              childrenCount: children.length,
              firstChildWidth: Math.round(firstChild.width)
            });
          }
        }
      });
      return issues;
    });
    pageResult.tests.cardsStackProperly = gridInfo.length === 0;
    if (gridInfo.length > 0) {
      pageResult.issues.push({
        type: 'MEDIUM',
        description: 'Some grid items may not be stacking properly on mobile',
        details: gridInfo
      });
    }

    // Test 9: Check forms are usable
    const formInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const formData = [];
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        const smallInputs = [];
        inputs.forEach(input => {
          const rect = input.getBoundingClientRect();
          if (rect.height < 40 && rect.height > 0) {
            smallInputs.push({
              type: input.type || input.tagName,
              height: Math.round(rect.height)
            });
          }
        });
        formData.push({
          inputCount: inputs.length,
          smallInputs: smallInputs
        });
      });
      return formData;
    });
    pageResult.tests.formsUsable = formInfo.every(f => f.smallInputs.length === 0);
    if (formInfo.some(f => f.smallInputs.length > 0)) {
      pageResult.issues.push({
        type: 'MEDIUM',
        description: 'Some form inputs may be too small for mobile',
        details: formInfo
      });
    }

    // Test 10: Check footer is navigable
    const footerInfo = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return { exists: false };
      const links = footer.querySelectorAll('a');
      const tooSmall = [];
      links.forEach(link => {
        const rect = link.getBoundingClientRect();
        if (rect.height < 30 && rect.height > 0) {
          tooSmall.push({
            text: link.textContent.trim().substring(0, 20),
            height: Math.round(rect.height)
          });
        }
      });
      return {
        exists: true,
        linkCount: links.length,
        smallLinks: tooSmall.slice(0, 5)
      };
    });
    pageResult.tests.footerNavigable = footerInfo.exists && footerInfo.smallLinks.length < 3;
    if (footerInfo.smallLinks && footerInfo.smallLinks.length >= 3) {
      pageResult.issues.push({
        type: 'LOW',
        description: 'Some footer links may be hard to tap on mobile',
        details: footerInfo.smallLinks
      });
    }

    // Test 11: Check for touch-friendly spacing
    const touchSpacing = await page.evaluate(() => {
      const clickables = document.querySelectorAll('a, button');
      const crowded = [];
      const rects = [];
      clickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          rects.push({ el, rect });
        }
      });
      // Check for elements too close together
      for (let i = 0; i < rects.length && crowded.length < 5; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i].rect;
          const r2 = rects[j].rect;
          const horizontalGap = Math.abs(r1.left - r2.right);
          const verticalGap = Math.abs(r1.top - r2.bottom);
          if (horizontalGap < 8 && Math.abs(r1.top - r2.top) < 10) {
            crowded.push({
              gap: Math.round(horizontalGap)
            });
            break;
          }
        }
      }
      return crowded;
    });
    pageResult.tests.touchFriendlySpacing = touchSpacing.length < 3;

  } catch (error) {
    pageResult.tests.error = error.message;
    pageResult.issues.push({
      type: 'CRITICAL',
      description: `Page test error: ${error.message}`
    });
  }

  return pageResult;
}

async function runTests() {
  console.log('Starting Mobile QA Tests...');
  console.log('Viewport: 375x812 (iPhone X)');
  console.log(`Testing ${PAGES.length} pages...\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  for (const pageInfo of PAGES) {
    console.log(`Testing: ${pageInfo.name}...`);
    const result = await testPage(page, pageInfo);
    results.pages.push(result);

    if (result.issues.length > 0) {
      results.issues.push(...result.issues.map(i => ({ ...i, page: pageInfo.name })));
    }
  }

  await browser.close();

  // Generate summary
  const criticalIssues = results.issues.filter(i => i.type === 'CRITICAL');
  const highIssues = results.issues.filter(i => i.type === 'HIGH');
  const mediumIssues = results.issues.filter(i => i.type === 'MEDIUM');
  const lowIssues = results.issues.filter(i => i.type === 'LOW');

  results.summary = {
    totalPages: PAGES.length,
    pagesWithIssues: results.pages.filter(p => p.issues.length > 0).length,
    totalIssues: results.issues.length,
    critical: criticalIssues.length,
    high: highIssues.length,
    medium: mediumIssues.length,
    low: lowIssues.length
  };

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'mobile-qa-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n========================================');
  console.log('MOBILE QA TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Pages Tested: ${results.summary.totalPages}`);
  console.log(`Pages with Issues: ${results.summary.pagesWithIssues}`);
  console.log(`Total Issues Found: ${results.summary.totalIssues}`);
  console.log(`  - CRITICAL: ${results.summary.critical}`);
  console.log(`  - HIGH: ${results.summary.high}`);
  console.log(`  - MEDIUM: ${results.summary.medium}`);
  console.log(`  - LOW: ${results.summary.low}`);
  console.log('========================================\n');

  // Print detailed issues
  if (criticalIssues.length > 0) {
    console.log('CRITICAL ISSUES:');
    criticalIssues.forEach(i => console.log(`  [${i.page}] ${i.description}`));
    console.log('');
  }
  if (highIssues.length > 0) {
    console.log('HIGH PRIORITY ISSUES:');
    highIssues.forEach(i => console.log(`  [${i.page}] ${i.description}`));
    console.log('');
  }
  if (mediumIssues.length > 0) {
    console.log('MEDIUM PRIORITY ISSUES:');
    mediumIssues.forEach(i => console.log(`  [${i.page}] ${i.description}`));
    console.log('');
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);
  console.log(`Full results saved to: ${SCREENSHOT_DIR}/mobile-qa-results.json`);
}

runTests().catch(console.error);
