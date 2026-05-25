// Reads the `gh_attr_{slug}` cookie written by CaptureAttribution and
// returns the parsed object, or {} if absent. Synchronous + cheap;
// safe to call on every render — the cookie is small.

export function readAttribution(slug: string): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const target = `gh_attr_${slug}=`;
  const raw = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(target));
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw.slice(target.length))) as Record<string, string>;
  } catch {
    return {};
  }
}
