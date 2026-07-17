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
