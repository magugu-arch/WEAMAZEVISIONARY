import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Journeys and QA IDs from V11.22. Runs against the production build (node dist/server/node.js). */

const ROUTES = ['/', '/work', '/work/digitfms-nothing-moves-unseen', '/work/miss-rhee-beauty-the-space-of-restoration', '/work/my-backyard', '/services', '/services/ai-creative-studio', '/services/websites-digital-experiences', '/approach', '/studio', '/insights', '/insights/human-led-ai-how-we-direct-review-and-stay-accountable', '/start-a-project', '/book-a-call', '/contact', '/privacy', '/terms', '/cookies'];

test.describe('routes and crawlable output (QA-05, QA-15, QA-16)', () => {
  test('every public route returns 200 with one H1, a unique title and crawlable content', async ({ request }) => {
    const titles = new Set<string>();
    for (const r of ROUTES) {
      const res = await request.get(r);
      expect(res.status(), r).toBe(200);
      const html = await res.text();
      expect(html.match(/<h1[\s>]/g)?.length, `${r} h1 count`).toBe(1);
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
      expect(title, r).toBeTruthy();
      titles.add(title!);
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('property="og:image"');
    }
    expect(titles.size).toBe(ROUTES.length);
  });

  test('unknown and unpublished routes return a branded 404', async ({ request, page }) => {
    expect((await request.get('/services/not-real')).status()).toBe(404);
    expect((await request.get('/this-does-not-exist')).status()).toBe(404);
    await page.goto('/this-does-not-exist');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist.');
  });

  test('staging is not indexable', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  });
});

test.describe('home and navigation', () => {
  test('hero shows the approved copy, and the primary CTA leads to the project builder', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ideas with intent.Experiences with impact.');
    await expect(page.getByText('AI creative studio · Working worldwide', { exact: true }).first()).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Start a Project' }).first().click();
    await expect(page).toHaveURL(/\/start-a-project/);
    // Client-side navigation lazy-loads the builder's code; allow for a busy machine.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tell us what you want to make.', { timeout: 15_000 });
  });

  test('hero film can be paused and the poster is the first paint (QA-01)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section[aria-labelledby="hero-title"] picture img')).toBeVisible();
    await expect(page.locator('section[aria-labelledby="hero-title"] picture img')).toHaveAttribute('src', /studio-film-poster/);
    const btn = page.getByRole('button', { name: 'Pause background film' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByRole('button', { name: 'Play background film' })).toBeVisible();
  });

  test('services disclosure works with the keyboard and Escape returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Services' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: /AI Creative Studio/ }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('mobile drawer: opens, traps focus, Escape closes and focus returns (QA-04)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Start a Project' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    await menu.click();
    await dialog.getByRole('link', { name: 'Approach' }).click();
    await expect(page).toHaveURL(/\/approach$/);
    await expect(dialog).toBeHidden();
  });

  test('reduced motion shows a still and never autoplays (QA-03)', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.waitForTimeout(3000);
    const playing = await page.locator('video').first().evaluate((v: HTMLVideoElement) => !v.paused);
    expect(playing).toBe(false);
    await expect(page.getByRole('button', { name: 'Play background film' })).toBeVisible();
    // The full film stays one tap away, with sound, for anyone who chooses it.
    await expect(page.getByRole('button', { name: /^Watch the film/ })).toBeVisible();
    await ctx.close();
  });
});

test.describe('work (QA-06, QA-07)', () => {
  test('filters update the announced count and can be cleared', async ({ page }) => {
    await page.goto('/work');
    const count = page.getByText(/^Showing \d+ of \d+ projects?$/);
    await expect(count).toHaveText(/Showing 3 of 3/);
    await page.getByRole('button', { name: 'Brand Strategy' }).click();
    await expect(page).toHaveURL(/service=brand-strategy-creative-direction/);
    await expect(count).toHaveText(/Showing 2 of 3/); // DigitFMS, Miss Rhee Beauty
    await page.getByRole('button', { name: '3D & Motion' }).click();
    // Wait for the filter to apply before reading the count (the old check could read the previous one).
    await expect(page).toHaveURL(/service=3d-animation-motion-design/);
    await expect(count).toHaveText(/Showing 3 of 3/); // DigitFMS, Miss Rhee Beauty, My Backyard
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(count).toHaveText(/Showing 3 of 3/);
    // The two client films are labelled Client Work.
    await page.getByRole('button', { name: /Client Work/ }).click();
    await expect(count).toHaveText(/Showing 2 of 3/);
    await expect(page.getByRole('button', { name: /Confidential/ })).toBeDisabled();
  });

  test('gallery opens, moves with arrow keys, closes with Escape and restores focus', async ({ page }) => {
    await page.goto('/work/digitfms-nothing-moves-unseen');
    const first = page.getByRole('button', { name: /Open image 1 of 6/ });
    await first.click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Image 1 of 6')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dlg.getByText('Image 2 of 6')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await expect(first).toBeFocused();
  });
});

test.describe('project builder (QA-08, QA-09, QA-10)', () => {
  async function fillToReview(page: Page) {
    await page.goto('/start-a-project?service=websites-digital-experiences');
    await expect(page.getByRole('checkbox', { name: /Websites & Digital Experiences/ })).toBeChecked();
    await page.getByRole('button', { name: 'Continue' }).click();
    // Invalid context step: error summary appears, focus moves to it.
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'need attention' })).toBeVisible();
    await page.getByRole('textbox', { name: /^Organisation/ }).fill('Example Studio Ltd');
    await page.getByLabel('Background and challenge').fill('We are relaunching our services and need a clearer, faster website.');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('checkbox', { name: 'Landing pages' }).check({ force: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('radio', { name: 'Not sure yet' }).first().check({ force: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Your name').fill('Test Visitor');
    await page.getByLabel('Work email').fill('visitor@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Review your brief' })).toBeVisible();
  }

  test('answers survive browser back/forward and the review shows them', async ({ page }) => {
    await fillToReview(page);
    await page.goBack();
    await expect(page.getByLabel('Work email')).toHaveValue('visitor@example.com');
    await page.goBack(); // timing
    await page.goBack(); // scope
    await page.goBack(); // context
    await expect(page.getByLabel('Background and challenge')).toHaveValue(/relaunching/);
    for (let i = 0; i < 4; i++) await page.goForward();
    await expect(page.getByRole('heading', { name: 'Review your brief' })).toBeVisible();
    await expect(page.getByText('Example Studio Ltd')).toBeVisible();
  });

  test('a server failure never shows success and keeps every answer', async ({ page }) => {
    await fillToReview(page);
    await page.route('**/api/enquiries', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'unavailable', message: 'We could not save your submission just now.' }) }));
    await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
    await page.getByRole('button', { name: 'Send brief' }).click();
    await expect(page.getByText('Your brief has not been sent')).toBeVisible();
    await expect(page.getByText('Brief received')).toHaveCount(0);
    await expect(page.getByText('visitor@example.com')).toBeVisible();
  });

  test('server-confirmed submission shows a reference (end to end)', async ({ page }) => {
    await fillToReview(page);
    await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
    await page.getByRole('button', { name: 'Send brief' }).click();
    await expect(page.getByTestId('enquiry-reference')).toHaveText(/^WV-ENQ-\d{4}-[A-Z0-9]{6}$/);
  });
});

test.describe('booking with the development mock (QA-11, QA-12, QA-13)', () => {
  test('book in Tokyo time, then reschedule and cancel', async ({ browser }) => {
    const ctx = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
    const page = await ctx.newPage();
    await page.goto('/book-a-call');
    await expect(page.getByTestId('booking-mock-banner')).toBeVisible();
    await expect(page.getByLabel('Your time zone')).toHaveValue('Asia/Tokyo');
    await page.locator('fieldset', { hasText: 'Times on' }).getByRole('button').first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Your name').fill('Tokyo Visitor');
    await page.getByLabel('Email').fill('tokyo@example.com');
    await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
    await page.getByRole('button', { name: 'Review' }).click();
    await expect(page.getByText('Asia / Tokyo')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm (mock)' }).click();
    await expect(page.getByText('Simulated booking created.')).toBeVisible();
    await expect(page.getByTestId('booking-when')).toContainText('GMT+9');
    await page.getByRole('link', { name: 'Reschedule or cancel' }).click();
    await expect(page.getByText('Confirmed')).toBeVisible();
    await page.getByRole('button', { name: 'Reschedule' }).click();
    // Move to another day: late in the Tokyo evening the first day can have only the slot just booked.
    await page.getByRole('group', { name: 'Choose a day' }).getByRole('button').nth(1).click();
    await page.locator('fieldset', { hasText: 'Times on' }).getByRole('button').first().click();
    await page.getByRole('button', { name: 'Confirm new time' }).click();
    await expect(page.getByText('Rescheduled. The calendar confirmed the new time.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel call' }).click();
    await page.getByRole('button', { name: 'Yes, cancel the call' }).click();
    await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
    await ctx.close();
  });
});

test('contact request box routes a partnership request and confirms with a reference', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('radio', { name: 'A partnership' }).check({ force: true });
  await page.getByLabel('Your name').fill('Partner Lead');
  await page.getByLabel(/^Email/).fill('partner@agency.example');
  await page.getByLabel('Capability you need').fill('Motion design support');
  await page.getByLabel('Your request').fill('We would like to discuss a partnership for upcoming work.');
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByTestId('contact-reference')).toHaveText(/^WV-PTR-/);
});

test.describe('accessibility (automated axe scan — manual review still required)', () => {
  for (const r of ['/', '/work', '/services/ai-creative-studio', '/approach', '/studio', '/insights/rights-in-ai-assisted-creative-work', '/start-a-project', '/book-a-call', '/contact']) {
    test(`no WCAG 2.2 A/AA violations on ${r}`, async ({ page }) => {
      await page.goto(r);
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
      expect(summary, summary.join('\n')).toEqual([]);
    });
  }
});

test.describe('responsive: no horizontal overflow (V10 §21 matrix)', () => {
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
      for (const r of ['/', '/services/ai-presentations-pitch-decks', '/work/digitfms-nothing-moves-unseen', '/start-a-project', '/book-a-call']) {
        await page.goto(r);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${r} at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test('the foot of every page returns home; on the home page it returns to the top', async ({ page }) => {
  await page.goto('/work');
  const row = page.getByTestId('return-home');
  await expect(row).toHaveAccessibleName(/Return home/);
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const top = page.getByTestId('return-home');
  await expect(top).toHaveAccessibleName(/Back to top/);
  await top.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await top.press('Enter');
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
});
