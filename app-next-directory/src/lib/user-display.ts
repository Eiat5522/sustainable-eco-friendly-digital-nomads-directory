export type UserDisplaySource = {
  name?: string | null;
  email?: string | null;
};

type UserDisplayInfo = {
  displayName: string;
  shortName: string;
  initials: string;
};

export function getUserDisplayInfo(
  source?: UserDisplaySource | null,
  fallback = 'Your account'
): UserDisplayInfo {
  const name = source?.name?.trim() ?? '';
  const email = source?.email?.trim() ?? '';
  const displayName = name || email || fallback;
  const shortName = name ? name.split(' ')[0] : '';
  const initialsSource = name || email;

  const initials = initialsSource
    ? initialsSource
        .split(' ')
        .map(part => part.trim().charAt(0).toUpperCase())
        .join('')
        .slice(0, 2)
    : 'U';

  return {
    displayName,
    shortName,
    initials,
  };
}
