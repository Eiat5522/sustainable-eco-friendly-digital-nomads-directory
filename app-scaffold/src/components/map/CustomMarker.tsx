/*...*/
export function createCustomMarker(listing: Listing): L.Icon {
  const color = CATEGORY_COLORS[listing.category as CategoryType] || '#6B7280'; // gray-500 as fallback

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <path fill="${color}" d="M16 0c8.837 0 16 7.163 16 16 0 8.836-16 28-16 28S0 24.836 0 16C0 7.163 7.163 0 16 0z"/>
      <circle fill="white" cx="16" cy="16" r="6"/>
    </svg>
  `;

  const iconUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

  return new L.Icon({
    iconUrl,
    iconSize: [32, 44],
    /*...*/
  });
}
/*...*/
