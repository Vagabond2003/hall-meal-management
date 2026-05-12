/** Allowed: letters, numbers, spaces, hyphens; length 1–20 after trim. */
export const ROOM_NUMBER_PATTERN = /^[a-zA-Z0-9 \-]{1,20}$/;

export function isValidRoomNumber(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 20 && ROOM_NUMBER_PATTERN.test(t);
}

/** Empty or whitespace-only → null (clear room). Otherwise must pass validation. */
export function parseOptionalRoomNumber(
  value: unknown
): { ok: true; room: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, room: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Invalid room number" };
  }
  const t = value.trim();
  if (t === "") return { ok: true, room: null };
  if (t.length > 20) return { ok: false, error: "Room number must be at most 20 characters" };
  if (!ROOM_NUMBER_PATTERN.test(t)) {
    return {
      ok: false,
      error:
        "Room number may only contain letters, numbers, spaces, and hyphens (1–20 characters)",
    };
  }
  return { ok: true, room: t };
}
