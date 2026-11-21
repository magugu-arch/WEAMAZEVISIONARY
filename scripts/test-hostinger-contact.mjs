/**
 * Sends ONE clearly labelled test message through the Contact page of a running site, in a
 * real browser, exactly as a visitor would, and says which email to look for in the inbox:
 *
 *   node scripts/test-hostinger-contact.mjs https://weamazevisionary.com          (dry run)
 *   node scripts/test-hostinger-contact.mjs https://weamazevisionary.com --send   (sends it)
 *
 * Without --send it fills the form in and stops: nothing is sent. With --send, one message
 * is saved with the site's enquiries and emailed to the studio. The script cannot open the
 * inbox, so the last step is a person's: it prints the subject and the sender to look for.
 * Exits 1 if the form does not confirm the message. See docs/14_DEPLOY_HOSTINGER.md,
 * section 13, "Check it works".
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
const send = args.includes('--send');
if (!base) {
  console.error('Give the site address, for example: node scripts/test-hostinger-contact.mjs https://weamazevisionary.com --send');
  process.exit(1);
}

// What the message says. Nothing personal: the name and address are the site's own.
const when = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
const message = {
  name: 'Website test',
  email: 'website@weamazevisionary.com',
  subject: `Website test ${when}: please ignore`,
  request: 'This is a test of the contact form, sent by the site check (scripts/test-hostinger-contact.mjs). No reply is needed and it can be deleted.',
};

// Behind an outbound proxy (some build environments), the browser must be told about it.
const proxy = base.startsWith('https://') && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
const browser = await chromium.launch(proxy);
const page = await browser.newPage();
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => problems.push(e.message.slice(0, 160)));

const fail = async (why) => {
  console.error(`FAIL  ${why}`);
  if (problems.length) console.error(`      browser errors: ${problems.join(' | ')}`);
  await browser.close();
  process.exit(1);
};

const opened = await page.goto(`${base}/contact`, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);
if (!opened || opened.status() !== 200) await fail(`the Contact page did not load (${opened ? opened.status() : 'no answer'})`);

await page.getByRole('radio', { name: 'A project' }).check({ force: true });
await page.getByLabel('Your name').fill(message.name);
await page.getByLabel(/^Email/).fill(message.email);
await page.getByLabel('Subject').fill(message.subject);
await page.getByLabel('Your request').fill(message.request);
await page.getByRole('checkbox', { name: /I agree/ }).check({ force: true });
console.log(`site:     ${base}`);
console.log(`message:  "${message.subject}" from ${message.name} <${message.email}>`);

if (!send) {
  console.log('DRY RUN   the form was filled in and NOT sent. Add --send to send this one message.');
  await browser.close();
  process.exit(0);
}

// The site treats a form filled in under 3 seconds as a robot, so wait as a person would.
await page.waitForTimeout(5_000);
const answered = page.waitForResponse((r) => r.url().endsWith('/api/enquiries') && r.request().method() === 'POST', { timeout: 30_000 }).catch(() => null);
await page.getByRole('button', { name: 'Send request' }).click();
const answer = await answered;
if (!answer) await fail('the form got no answer from /api/enquiries within 30 seconds');
const body = await answer.json().catch(() => ({}));
if (answer.status() !== 201) await fail(`the site refused the message: ${answer.status()} ${body.message ?? ''}`.trim());

const shown = await page.getByTestId('contact-reference').textContent({ timeout: 10_000 }).catch(() => null);
if (!shown || shown !== body.reference) await fail('the page did not confirm the message with its reference');
if (await page.getByText('Your request has not been sent').count()) await fail('the page shows "Your request has not been sent"');
const notice = (await page.getByText(/A copy is on its way to/).first().textContent({ timeout: 5_000 }).catch(() => '')) ?? '';
const inbox = (notice.match(/A copy is on its way to (\S+@\S+?)\.(?:\s|$)/) ?? [])[1];

console.log(`PASS      sent and confirmed on the page · reference ${body.reference}`);
console.log(`          saved: yes (the site answered 201) · studio email: ${body.notifications?.studioEmail ?? 'unknown'}`);
if (problems.length) console.log(`          browser errors during the test: ${problems.join(' | ')}`);
if (body.notifications?.studioEmail === 'queued') {
  console.log('');
  console.log(`NOW CHECK THE INBOX${inbox ? ` (${inbox})` : ''}, and its Spam folder, within about 10 minutes, for:`);
  console.log(`          Subject:  ${message.subject} — ${message.name} (${body.reference})`);
  console.log('          From:     WeAmaze Visionary website <website@weamazevisionary.com>');
  console.log('          If nothing arrives: create the mailbox website@weamazevisionary.com in hPanel → Emails.');
  console.log('          The site keeps the message and sends the email again by itself after the next form is used.');
} else {
  console.log('          The site is not set up to email the studio: the message is saved only.');
}
await browser.close();
process.exit(problems.length ? 1 : 0);
