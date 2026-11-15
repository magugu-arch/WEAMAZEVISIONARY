/**
 * Structured logging without personal data: never log names, emails, phone
 * numbers or free-text briefs (V10 §22). Pass references and codes only.
 */
type Level = 'info' | 'warn' | 'error';
export function log(level: Level, event: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
