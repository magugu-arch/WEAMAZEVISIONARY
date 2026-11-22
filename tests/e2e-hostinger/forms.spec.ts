import { expect, test, type Page } from '@playwright/test';

/**
 * The three forms on Hostinger web hosting, end to end in a real browser: the pages as built,
 * the PHP form handler (deploy/hostinger-static/api) answering /api/enquiries.
 */
const watch = (page: Page) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
  return problems;
};

test('project brief: sent, stored and confirmed with a reference', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/start-a-project?service=websites-digital-experiences');
  await expect(page.getByRole('checkbox', { name: /Websites & Digital Experiences/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('textbox', { name: /^Organisation/ }).fill('Example Studio Ltd');
  await page.getByLabel('Background and challenge').fill('We are relaunching our services and need a clearer, faster website.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('checkbox', { name: 'Landing pages' }).check({ force: true });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Not sure yet' }).first().check({ force: true });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill('Hostinger Visitor');
  await page.getByLabel('Work email').fill('visitor@example.com');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Review your brief' })).toBeVisible();
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  const sent = page.waitForResponse((r) => r.url().endsWith('/api/enquiries') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Send brief' }).click();
  expect((await sent).status()).toBe(201);
  await expect(page.getByTestId('enquiry-reference')).toHaveText(/^WV-ENQ-\d{4}-[A-Z0-9]{6}$/);
  await expect(page.getByText('Your brief has not been sent')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('contact request box: sent and confirmed, with a copy to the studio', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/contact');
  await page.getByRole('radio', { name: 'A project' }).check({ force: true });
  await page.getByLabel('Your name').fill('Contact Visitor');
  await page.getByLabel(/^Email/).fill('contact@example.com');
  await page.getByLabel('Subject').fill('A short film for our launch');
  await page.getByLabel('Your request').fill('We would like to talk about a short brand film for our launch in March.');
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByTestId('contact-reference')).toHaveText(/^WV-MSG-\d{4}-[A-Z0-9]{6}$/);
  await expect(page.getByText(/A copy is on its way to weamazevisionary@gmail\.com/)).toBeVisible();
  expect(problems).toEqual([]);
});

test('book a call: offers the call request form, which is sent and confirmed', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/book-a-call');
  await expect(page.getByText('Online scheduling is not connected yet')).toBeVisible();
  await expect(page.getByText('Scheduling could not be reached')).toHaveCount(0);
  const form = page.getByRole('form', { name: 'Call request' });
  await form.getByLabel('Your name').fill('Call Visitor');
  await form.getByLabel(/^Email/).fill('call@example.com');
  await form.getByRole('checkbox', { name: 'Weekday mornings' }).check({ force: true });
  await form.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  await form.getByRole('button', { name: 'Send call request' }).click();
  await expect(page.getByTestId('call-reference')).toHaveText(/^WV-CALL-\d{4}-[A-Z0-9]{6}$/);
  expect(problems).toEqual([]);
});

test('a problem the server finds is shown beside the field, and nothing is lost', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Field Visitor');
  await page.getByLabel(/^Email/).fill('field@example.com');
  await page.getByLabel('Your request').fill('This message is long enough to pass.');
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  // Let the page pass its own checks, then change the answer on its way out so only the server can catch it.
  await page.route('**/api/enquiries', async (route) => {
    const body = route.request().postDataJSON();
    body.payload.email = 'not-an-email';
    await route.continue({ postData: JSON.stringify(body) });
  });
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Enter an email address in the format name@example.com.').first()).toBeVisible();
  await expect(page.getByTestId('contact-reference')).toHaveCount(0);
  await expect(page.getByLabel('Your request')).toHaveValue('This message is long enough to pass.');
});

test('the offline edition opened by its web address plays its films (its own policy applies)', async ({ page, request }) => {
  const head = await request.head('/downloads/weamaze-visionary.html');
  expect(head.status()).toBe(200);
  // Its own, stricter policy replaces the site's (which would block its embedded films and fonts).
  const policy = head.headers()['content-security-policy'] ?? '';
  expect(policy).toContain("default-src 'none'");
  expect(policy).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+'/);
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toContain("default-src 'self'");
  expect(head.headers()['x-frame-options']).toBe('DENY');
  expect((await request.head('/')).headers()['content-security-policy']).toContain("default-src 'self'");
  const problems = watch(page);
  await page.goto('/downloads/weamaze-visionary.html', { waitUntil: 'load' });
  await page.locator('video').first().evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play(); });
  await page.waitForFunction(() => { const v = document.querySelector('video'); return Boolean(v && v.currentTime > 0.2 && !v.error); }, null, { timeout: 15_000 });
  expect(problems).toEqual([]);
});


test('a folder with no page of its own is "not found", and never sends a visitor round in a circle', async ({ request }) => {
  // Found on the live site (20 November 2026): /images redirected to /images/ and back for ever.
  for (const path of ['/images', '/images/', '/assets', '/assets/', '/video/', '/downloads', '/downloads/', '/app-icons/']) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(404);
    expect(await res.text(), path).toContain('Page not found');
  }
  // Pages keep one address: the slash form redirects once, and the page itself answers.
  const slash = await request.get('/work/', { maxRedirects: 0 });
  expect(slash.status()).toBe(301);
  expect(new URL(slash.headers().location ?? '', 'http://x').pathname).toBe('/work');
  expect((await request.get('/work', { maxRedirects: 0 })).status()).toBe(200);
});

test('scripts, styles and fonts are kept for a year; www goes to the bare domain', async ({ request }) => {
  const home = await (await request.get('/')).text();
  const files = [...home.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(?:js|css|woff2))"/g)].map((m) => m[1] ?? '');
  for (const kind of ['.woff2', '.js', '.css']) {
    const file = files.find((f) => f.endsWith(kind)) ?? '';
    expect(file, `the home page loads a ${kind} file from /assets`).not.toBe('');
    expect((await request.head(file)).headers()['cache-control'], file).toBe('public, max-age=31536000, immutable');
  }
  const www = await request.get('/work?from=test', { maxRedirects: 0, headers: { host: 'www.weamazevisionary.test' } });
  expect(www.status()).toBe(301);
  expect(www.headers().location).toBe('https://weamazevisionary.test/work?from=test');
});
