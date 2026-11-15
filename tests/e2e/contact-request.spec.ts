import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/** The Contact page request box: addressed to the studio inbox, with an email-app route that needs no server. */
const TO = 'weamazevisionary@gmail.com';
const mail = (href: string) => { const u = new URL(href); return { to: u.pathname, subject: u.searchParams.get('subject'), body: u.searchParams.get('body') ?? '' }; };

test('the box is addressed to the studio and its email-app link carries what was written', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByText(`WeAmaze Visionary <${TO}>`)).toBeVisible();
  await page.getByRole('radio', { name: 'Press or speaking' }).check({ force: true });
  await page.getByLabel('Your name').fill('Lee Chen');
  await page.getByLabel(/^Email/).fill('lee@paper.example');
  await page.getByLabel('Subject').fill('Interview request');
  await page.getByLabel('Your request').fill('Could we interview the founder about creative technology?');
  await expect(page.getByText('57 / 4,000')).toBeVisible();
  const href = await page.getByRole('link', { name: 'Open in your email app' }).getAttribute('href');
  const m = mail(href!);
  expect(m.to).toBe(TO);
  expect(m.subject).toBe('Interview request');
  expect(m.body.startsWith('Could we interview the founder about creative technology?')).toBe(true);
  expect(m.body).toContain('Name: Lee Chen');
  expect(m.body).toContain('Topic: Press or speaking');
});

test('a draft survives a reload in the same tab, and is cleared once sent', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Draft Keeper');
  await page.getByLabel('Your request').fill('Half-written thoughts about a new brand film.');
  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.getByLabel('Your name')).toHaveValue('Draft Keeper');
  await expect(page.getByLabel('Your request')).toHaveValue('Half-written thoughts about a new brand film.');
  await page.getByLabel(/^Email/).fill('draft@example.com');
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByTestId('contact-reference')).toHaveText(/^WV-MSG-/);
  await page.reload();
  await expect(page.getByLabel('Your name')).toHaveValue('');
});

test('if the server cannot take the request, nothing is lost and the email app is offered', async ({ page }) => {
  await page.route('**/api/enquiries', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'unavailable', message: 'We could not save your submission just now.' }) }));
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Resilient Sender');
  await page.getByLabel(/^Email/).fill('sender@example.com');
  await page.getByLabel('Your request').fill('Please call me about a launch campaign next quarter.');
  await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Your request has not been sent')).toBeVisible();
  await expect(page.getByLabel('Your request')).toHaveValue('Please call me about a launch campaign next quarter.');
  const fallback = page.getByRole('link', { name: 'Send it from your email app instead' });
  expect(mail((await fallback.getAttribute('href'))!).body).toContain('Please call me about a launch campaign next quarter.');
});

test('WCAG 2.2 AA scan and no overflow on a phone', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('/contact', { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
  await ctx.close();
});

test('offline edition: a request box that opens a new email with no server and no JavaScript', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(resolve('dist/client/downloads/weamaze-visionary.html')).href, { waitUntil: 'load' });
  const form = page.locator(`form[action="mailto:${TO}"]`);
  await expect(form).toHaveAttribute('method', 'get');
  await expect(form.locator('input[name="subject"]')).toBeVisible();
  await expect(form.locator('textarea[name="body"]')).toBeVisible();
  await expect(form.getByRole('button', { name: 'Open in your email app' })).toBeVisible();
  await ctx.close();
});
