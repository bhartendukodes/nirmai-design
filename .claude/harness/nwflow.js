#!/usr/bin/env node
// nwflow.js — puppeteer runtime suite for NirmAI-Website.html (recreated)
// usage: node nwflow.js [suite]   suites: base | burger | all (default)
const puppeteer = require('puppeteer');
const path = require('path');
const FILE = 'file:///Users/bhartendukodes/MYWORK/NirmAI-Website.html';
const SHOT = p => path.join(__dirname, p);
const suite = process.argv[2] || 'all';
let fail = 0;
const check = (name, ok, detail) => { console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : '')); if (!ok) fail++; };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // ---- desktop base ----
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(FILE, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => errors.push('goto: ' + e.message));
  await new Promise(r => setTimeout(r, 2500));

  if (suite === 'base' || suite === 'all') {
    check('no console/page errors on load', errors.length === 0, errors.slice(0, 3).join(' | '));
    const pages = await page.$$eval('.nw-page', els => els.length);
    check('5 nw-pages in DOM', pages === 5, String(pages));
    await page.evaluate(() => { location.hash = '#/builders'; });
    await new Promise(r => setTimeout(r, 600));
    const buildersActive = await page.evaluate(() => {
      const act = document.querySelector('.nw-page.is-active');
      return act ? act.id || act.dataset.page || 'unnamed-active' : 'none';
    });
    check('router: #/builders activates a page', buildersActive !== 'none', buildersActive);
    await page.evaluate(() => { location.hash = '#/'; });
    await new Promise(r => setTimeout(r, 600));
    const burgerDesktop = await page.$eval('#navBurger', el => getComputedStyle(el).display).catch(() => 'missing');
    check('desktop: burger hidden', burgerDesktop === 'none', String(burgerDesktop));
    const cta = await page.$eval('#heroCTA', el => ({ vis: getComputedStyle(el).display !== 'none', txt: el.textContent.trim().slice(0, 40), h: el.getBoundingClientRect().height })).catch(() => null);
    check('heroCTA present & visible', !!cta && cta.vis, cta ? cta.txt + ' (h=' + Math.round(cta.h) + 'px)' : 'missing');
    await page.screenshot({ path: SHOT('nw-desktop-home.png') });
  }

  // ---- mobile burger ----
  if (suite === 'burger' || suite === 'all') {
    const preErr = errors.length;
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(FILE, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => errors.push('goto-mobile: ' + e.message));
    await new Promise(r => setTimeout(r, 2000));
    const burger = await page.$eval('#navBurger', el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { display: cs.display, w: r.width, h: r.height }; }).catch(() => null);
    check('mobile: burger visible', !!burger && burger.display !== 'none', burger ? JSON.stringify(burger) : 'missing');
    check('mobile: burger >= 44px target', !!burger && burger.w >= 44 && burger.h >= 44, burger ? Math.round(burger.w) + 'x' + Math.round(burger.h) : '');
    const linksBefore = await page.$eval('#navLinks', el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0 && (cs.transform === 'none' || !cs.transform.includes('matrix') || r.top < 900); }).catch(() => null);
    await page.screenshot({ path: SHOT('nw-mobile-closed.png') });
    await page.click('#navBurger').catch(e => errors.push('burger click: ' + e.message));
    await new Promise(r => setTimeout(r, 500));
    const linksOpen = await page.$eval('#navLinks', el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { shown: cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0 && r.left < 390, cls: el.className }; }).catch(() => null);
    check('mobile: burger opens navLinks', !!linksOpen && linksOpen.shown, linksOpen ? linksOpen.cls : 'missing');
    await page.screenshot({ path: SHOT('nw-mobile-open.png') });
    // tap a nav link -> routes and menu closes
    const routed = await page.evaluate(() => {
      const link = document.querySelector('#navLinks a[href*="#/"]');
      if (!link) return { ok: false, why: 'no link' };
      link.click();
      return { ok: true, href: link.getAttribute('href') };
    });
    await new Promise(r => setTimeout(r, 700));
    const afterNav = await page.evaluate(() => {
      const links = document.getElementById('navLinks');
      const cs = getComputedStyle(links);
      const closed = cs.display === 'none' || cs.visibility === 'hidden' || links.getBoundingClientRect().height === 0 || !/open|is-open|active/.test(links.className);
      const act = document.querySelector('.nw-page.is-active');
      return { closed, active: act ? (act.id || 'active') : 'none', hash: location.hash };
    });
    check('mobile: nav link routes', routed.ok && afterNav.active !== 'none', routed.href + ' -> ' + afterNav.active + ' (' + afterNav.hash + ')');
    check('mobile: menu closes after link tap', afterNav.closed, '');
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('mobile: no horizontal body scroll', hscroll <= 0, hscroll + 'px overflow');
    await page.screenshot({ path: SHOT('nw-mobile-after-route.png') });
    check('no new errors during burger suite', errors.length === preErr, errors.slice(preErr, preErr + 3).join(' | '));
  }

  await browser.close();
  console.log(fail === 0 ? 'ALL FLOW CHECKS PASS' : fail + ' FLOW CHECK(S) FAILED');
  process.exit(fail === 0 ? 0 : 1);
})();
