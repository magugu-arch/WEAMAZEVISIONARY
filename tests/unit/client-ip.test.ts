import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { clientIp } from '@server/lib/nodeAdapter';

const req = (xff?: string) => ({ headers: xff ? { 'x-forwarded-for': xff } : {}, socket: { remoteAddress: '10.0.0.2' } }) as unknown as IncomingMessage;

describe('client address for rate limiting', () => {
  it('uses the socket when no proxy is trusted, whatever the headers claim', () => {
    expect(clientIp(req('6.6.6.6'), false)).toBe('10.0.0.2');
  });
  it('never trusts the left-most, visitor-written entry', () => {
    // Visitor forges "6.6.6.6"; the one trusted proxy appends the real address.
    expect(clientIp(req('6.6.6.6, 198.51.100.7'), true, 1)).toBe('198.51.100.7');
    // Cloudflare then the host edge: the visitor is two places from the right.
    expect(clientIp(req('6.6.6.6, 198.51.100.7, 172.70.1.1'), true, 2)).toBe('198.51.100.7');
  });
  it('falls back safely when the header is missing or short', () => {
    expect(clientIp(req(), true, 2)).toBe('10.0.0.2');
    expect(clientIp(req('198.51.100.7'), true, 2)).toBe('198.51.100.7');
  });
});
