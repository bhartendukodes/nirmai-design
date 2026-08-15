#!/usr/bin/env node
/* NirmAI persona E2E harness — drives NirmAI-Web-Dashboard.html + NirmAI-Mobile-v3.html
 * through every role's journey and asserts the access matrix + canon invariants.
 * Spec: docs/superpowers/specs/2026-07-16-persona-journeys-e2e.md
 * Run:  node docs/superpowers/harness/e2e-personas.js   (from a dir where `playwright-core` is installed,
 *       or set NODE_PATH; uses system Chrome via channel:'chrome')
 */
const { createRequire } = require('module');
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch (e) { ({ chromium } = createRequire(process.cwd() + '/')('playwright-core')); }

const DASH = 'file:///Users/bhartendukodes/MYWORK/NirmAI-Web-Dashboard.html';
const MOB = 'file:///Users/bhartendukodes/MYWORK/NirmAI-Mobile-v3.html';
const results = [];
const t = (name, ok, note) => { results.push({ name, ok: !!ok, note: note || '' }); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  const login = async who => {
    await page.goto(DASH); await page.waitForTimeout(500);
    await page.locator('[data-login]', { hasText: who }).first().click();
    await page.waitForTimeout(600);
  };
  const go = async id => { await page.evaluate(k => { const el = document.querySelector(`[data-go="${k}"]`); if (el) el.click(); }, id); await page.waitForTimeout(400); };
  const navVisible = () => page.evaluate(() =>
    [...document.querySelectorAll('.nv[data-go]')].filter(n => n.style.display !== 'none').map(n => n.getAttribute('data-go')));
  const bodyHas = s => page.evaluate(x => document.body.innerText.toLowerCase().includes(x.toLowerCase()), s);

  /* ── global canon (dashboard) ── */
  await page.goto(DASH); await page.waitForTimeout(600);
  const src = await page.content();
  t('canon: ₹8,61,000 present', src.includes('8,61,000'));
  t('canon: ₹9,42,000 absent', !src.includes('9,42,000'));
  t('canon: no password inputs', !src.includes('type="password"'));
  t('canon: no visible DBOT/LIVINIT', await page.evaluate(() => !/dbot|livinit/i.test(document.body.innerText)));
  t('canon: no Link2Build', !/link2build/i.test(src));
  t('canon: milestone vocabulary', src.includes('Booking &amp; foundation') && src.includes('Walls &amp; electrical') && src.includes('Finishes &amp; handover'));

  /* ── Priya (homeowner) ── */
  await login('Priya');
  await go('quotes');
  t('Priya: contractor Q&A thread', await bodyHas('Deshmukh & Sons asked'));
  await page.locator('.qt2-choose .qt2-btn', { hasText: 'Choose Aakruti' }).click(); await page.waitForTimeout(300);
  t('Priya: choose builder produces state', await bodyHas('Chosen ✓'));
  await go('build');
  await page.locator('#page-build button', { hasText: "Approve this room's work" }).click(); await page.waitForTimeout(300);
  t('Priya: room approve produces state', await bodyHas('Room approved ✓'));
  t('Priya: room copy is milestone-only', await bodyHas('money moves per milestone, never per room'));
  t('Priya: documents card', await bodyHas('Documents & statements'));
  t('Priya: warranty card', await bodyHas('Warranty & snags'));
  await go('approvals');
  await page.locator('.ap2-btn-primary', { hasText: 'Approve change' }).first().click(); await page.waitForTimeout(250);
  await page.locator('.ap2-btn-ghost', { hasText: 'Keep original' }).first().click(); await page.waitForTimeout(250);
  t('Priya: approvals resolve → site resumes', await bodyHas('SITE WORK RESUMED'));
  await go('account');
  await page.locator('#page-account button', { hasText: 'Manage membership' }).click(); await page.waitForTimeout(300);
  t('Priya: billing/credits panel opens', await bodyHas('Design credits are the only usage currency'));
  await page.locator('[data-ov-close]').click().catch(() => {});
  t('Priya: studio ctx is her own (no Anaya leak)', await page.evaluate(() => {
    const el = document.querySelector('[data-go="designstudio"], [data-go="studio"]');
    if (el) el.click();
    const c = window.nvDesignCtx; return !c || c.buyer !== 'Anaya Kulkarni';
  }));

  /* ── Kiran (business owner) ── */
  await login('Kiran Sathe');
  // §9 harness law: assert IDENTITY, not presence. The old suite passed 49/49 while Kiran's chip
  // carried no data-role/data-perm, so PERSONA[key]||PERSONA['admin'] silently made him Nisha Rao
  // and the audit trail recorded her as the actor. "Nav renders" never caught it.
  // Kiran lands on page-ownerhome (Wave 3), which greets him by name. (My Tasks/DPR/Pro were cut
  // from the owner's sidebar 2026-07-18 to declutter, so we no longer assert via protasks.)
  t('Kiran: is actually Kiran, not Nisha', await bodyHas('Hello, Kiran') && !(await bodyHas('Hello, Nisha')));
  await go('flats');
  t('Kiran: full B2B nav (has Flats + WO)', (await navVisible()).includes('flats') && (await navVisible()).includes('workorders'));
  await go('flats');
  t('Kiran: approvals & access queue', await bodyHas('APPROVALS & ACCESS') || await bodyHas('Approvals & access'));
  t('Kiran: decision log', await bodyHas('DECISION LOG') || await bodyHas('Decision log'));
  await page.locator('[data-fl5-bulk="2BHK"]').click(); await page.waitForTimeout(300);
  // Was: t('bulk run result + retry', bodyHas('Retry 2 failed')) — that asserted the DEFECT. The old
  // strip was a second listener injecting "12 applied · 9 buyer invites sent · 2 failed (A-08-1 · A-03-2)"
  // regardless of the real handler; the counts were fake and neither flat code exists. Assert reality,
  // and keep the fabrication from coming back.
  t('Kiran: bulk run result is real', await bodyHas('Run complete') && await bodyHas('got the default design'));
  t('Kiran: bulk run reports no fabricated failures', !(await bodyHas('Retry 2 failed')) && !(await bodyHas('A-08-1')));
  await go('workorders');
  await page.locator('.wo3-worow').first().click(); await page.waitForTimeout(300);
  t('Kiran: WO detail overlay (₹6,77,025)', await bodyHas('6,77,025'));
  await page.locator('[data-ov-close]').click().catch(() => {});

  /* ── Rajesh (collaborator/PM) — gated nav ── */
  await login('Rajesh');
  const rNav = await navVisible();
  t('Rajesh: no Flats & Design', !rNav.includes('flats'), rNav.join(','));
  t('Rajesh: no Work Orders', !rNav.includes('workorders'));
  t('Rajesh: no Project Setup', !rNav.includes('dbsetup'));
  t('Rajesh: has planner+forecast+audit', rNav.includes('dbplanner') && rNav.includes('dbforecast') && rNav.includes('audit'));

  /* ── Meena (QC) — QC queue + gated nav ── */
  await login('Meena');
  const qNav = await navVisible();
  t('Meena: QC queue visible', await page.evaluate(() => { const p = document.getElementById('pt3-qc'); return p && !p.hidden; }));
  t('Meena: no commercial/plan modules', !qNav.includes('flats') && !qNav.includes('workorders') && !qNav.includes('dbsetup') && !qNav.includes('dbplanner') && !qNav.includes('dbforecast'));
  t('Meena: has issues+audit', qNav.includes('proissues') && qNav.includes('audit'));
  await go('proactivity');
  t('Meena: activity is ACT-1148 (cross-surface)', await bodyHas('ACT-1148'));
  t('Meena: SE checks live in INPROG', await page.evaluate(() => {
    const b = [...document.querySelectorAll('#page-proactivity .pa3-cb--se')];
    return b.length > 0 && b.every(x => !x.hasAttribute('aria-disabled'));
  }));

  /* ── Vikram (site engineer) — own login, field-tier nav ── */
  await login('Vikram Singh');
  const sNav = await navVisible();
  await go('protasks');
  t('Vikram: SE demo login exists + greeted', await bodyHas('Hello, Vikram'));
  t('Vikram: no commercial/setup/planner', !sNav.includes('flats') && !sNav.includes('workorders') && !sNav.includes('dbsetup') && !sNav.includes('dbplanner'));
  t('Vikram: has tasks+DPR+issues', sNav.includes('protasks') && sNav.includes('prodpr') && sNav.includes('proissues'));

  /* ── Sunil (data capturer) — web lockout ── */
  await login('Sunil');
  t('Sunil: capturer lockout interstitial', await page.evaluate(() => !!document.getElementById('nvCapturerGate')));
  t('Sunil: lockout names the mobile app', await bodyHas('NirmAI Pro mobile app'));
  await page.evaluate(() => { const g = document.getElementById('nvCapturerGate'); if (g) g.remove(); });

  /* ── Anita (viewer) — read-only ── */
  await login('Anita');
  const vNav = await navVisible();
  t('Anita: no tasks/DPR/commercial', !vNav.includes('protasks') && !vNav.includes('prodpr') && !vNav.includes('flats') && !vNav.includes('workorders'));
  t('Anita: viewer mode set (data-perm)', await page.evaluate(() => document.body.getAttribute('data-perm') === 'viewer'));

  /* ── mobile ── */
  const mp = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  mp.on('console', m => { if (m.type() === 'error') errors.push('MOB: ' + m.text()); });
  mp.on('pageerror', e => errors.push('MOB: ' + String(e)));
  await mp.goto(MOB); await mp.waitForTimeout(1500);
  t('mobile: 252 tiles', await mp.evaluate(() => document.querySelectorAll('.gal-tile').length === 252));
  const msrc = await mp.content();
  t('mobile: canon money', msrc.includes('8,61,000') && !msrc.includes('9,42,000'));
  t('mobile: no password inputs', !msrc.includes('type="password"'));
  t('mobile: progressive escrow (no upfront ledger)', !msrc.includes('7,74,900') && msrc.includes('funds milestone by milestone'));
  for (const [label, marker] of [
    ['QC persona home (PRO 28)', '28 QC inbox'], ['Capturer home (PRO 29)', '29 Capturer'],
    ['Comments (PRO 30)', '30 Comments'], ['Orders lane (U-31)', 'U-31 Orders'],
    ['SE sign-off (P-14)', 'P-14 Sign-off'], ['Approver OTP (C-33)', 'C-33 Approver'],
    ['Stop-work in raise issue', 'STOP WORK IN THIS ZONE'], ['Cross-surface activity', 'ACT-1148'],
  ]) t('mobile anchor: ' + label, msrc.includes(marker));

  t('ZERO console/page errors across all journeys', errors.length === 0, errors.slice(0, 5).join(' | '));

  /* ── report ── */
  const pass = results.filter(r => r.ok).length;
  console.log('\n══ NirmAI persona E2E — ' + pass + '/' + results.length + ' passed ══');
  for (const r of results) console.log((r.ok ? '  ✔ ' : '  ✘ ') + r.name + (r.ok || !r.note ? '' : '   [' + r.note + ']'));
  await browser.close();
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('HARNESS CRASH:', e.message); process.exit(2); });
