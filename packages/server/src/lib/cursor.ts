/**
 * Opaque keyset cursors over SQLite's monotonic `rowid`. Using rowid (rather
 * than a timestamp) gives a total, insertion-stable order even when many rows
 * share the same millisecond — so pagination never skips or repeats a row.
 */

export function encodeCursor(rowid: number): string {
  return Buffer.from(String(rowid), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): number | null {
  if (!cursor) return null;
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const n = Number(decoded);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
