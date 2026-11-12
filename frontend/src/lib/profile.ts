// Shared profile display helpers. The name is editable from the admin panel;
// these keep the logo initials and fallbacks in sync with whatever name is set.

export const DEFAULT_NAME = 'Lasha Ghongha';

/** First letters of the first two words, uppercased (e.g. "Lasha Ghongha" -> "LG"). */
export function getInitials(name?: string | null): string {
  const source = (name ?? DEFAULT_NAME).trim();
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

  return (initials || DEFAULT_NAME.slice(0, 2)).toUpperCase();
}

/** Download filename for the CV, e.g. "Lasha Ghonghadze" -> "CV_lasha_ghonghadze.pdf". */
export function cvDownloadName(name?: string | null): string {
  const slug = (name ?? 'cv')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `CV_${slug || 'cv'}.pdf`;
}
