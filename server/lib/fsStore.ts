import { mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

/** Durable JSON file write: write to a temp file, fsync, then atomic rename. */
export async function writeJsonDurable(path: string, data: unknown): Promise<void> {
  const dir = path.slice(0, path.lastIndexOf('/'));
  await mkdir(dir, { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  const fh = await open(tmp, 'w', 0o600);
  try {
    await fh.writeFile(JSON.stringify(data, null, 2));
    await fh.sync();
  } finally {
    await fh.close();
  }
  await rename(tmp, path);
}
export async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}
export async function listJson(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}
export async function remove(path: string) {
  await unlink(path).catch(() => {});
}
/** Create-only write: fails if the file already exists (used for idempotency claims). */
export async function createExclusive(path: string, data: unknown): Promise<boolean> {
  const dir = path.slice(0, path.lastIndexOf('/'));
  await mkdir(dir, { recursive: true });
  try {
    const fh = await open(path, 'wx', 0o600);
    try {
      await fh.writeFile(JSON.stringify(data));
      await fh.sync();
    } finally {
      await fh.close();
    }
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw e;
  }
}
