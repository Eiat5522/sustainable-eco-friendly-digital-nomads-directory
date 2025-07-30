import { render, screen } from '@testing-library/react';
import StaticMapImage from './StaticMapImage';

const listings = [
  { name: 'A', slug: 'a', address: 'addr', category: 'cafe', coordinates: { lat: 1, lng: 2 } },
  { name: 'B', slug: 'b', address: 'addr', category: 'cafe', coordinates: { lat: 3, lng: 4 } },
  { name: 'C', slug: 'c', address: 'addr', category: 'cafe' },
] as any[];

test('renders SEO content with valid listings only', () => {
  render(<StaticMapImage listings={listings} width={600} height={400} />);
  expect(screen.getByText('Sustainable Locations Map')).toBeInTheDocument();
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(2); // only listings with coordinates
  expect(items[0].textContent).toContain('A');
});