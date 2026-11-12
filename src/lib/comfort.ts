// Reading comfort (text size and night reading), remembered on this device under its own name.
// It once shared the name `oa_read` with the read ticks (a list of finished pieces): whichever wrote last wiped the other,
// so night reading would not stay on for anyone who had finished a piece. A setting left under the old name is carried over.
export interface Comfort { size?: number; night?: boolean }
const KEY = 'oa_comfort', OLD = 'oa_read';
export function loadComfort(): Comfort {
  try {
    const now = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (now && typeof now === 'object' && !Array.isArray(now)) return now;
    const old = JSON.parse(localStorage.getItem(OLD) || 'null');
    return old && typeof old === 'object' && !Array.isArray(old) ? { size: old.size, night: old.night } : {};
  } catch { return {}; }
}
export function saveComfort(c: Comfort) { try { localStorage.setItem(KEY, JSON.stringify({ size: c.size, night: !!c.night })); } catch {} }
