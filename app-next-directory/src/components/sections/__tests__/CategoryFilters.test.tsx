import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CategoryFilters } from '../CategoryFilters';

jest.mock('lucide-react', () => ({
  Laptop: () => <span data-testid="icon" />,
  Coffee: () => <span data-testid="icon" />,
  Bed: () => <span data-testid="icon" />,
  UtensilsCrossed: () => <span data-testid="icon" />,
  Mountain: () => <span data-testid="icon" />,
}));

describe('CategoryFilters', () => {
  it('toggles categories in uncontrolled mode and updates aria-pressed state', async () => {
    const user = userEvent.setup();
    render(<CategoryFilters />);

    const cafeButton = screen.getByRole('button', { name: /Cafe/ });

    expect(cafeButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(cafeButton);
    expect(cafeButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(cafeButton);
    expect(cafeButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects defaultValue when uncontrolled', () => {
    render(<CategoryFilters defaultValue={['activities']} />);

    const activitiesButton = screen.getByRole('button', { name: /Activities/ });
    expect(activitiesButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('notifies parent components when used in controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    const { rerender } = render(<CategoryFilters value={['cafe']} onChange={handleChange} />);

    const coworkingButton = screen.getByRole('button', { name: /Coworking/ });
    await user.click(coworkingButton);

    expect(handleChange).toHaveBeenCalledWith(['cafe', 'coworking']);

    rerender(<CategoryFilters value={['cafe', 'coworking']} onChange={handleChange} />);
    expect(coworkingButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports custom item lists supplied by parents', () => {
    const CustomHarness = () => {
      const [value, setValue] = useState<string[]>([]);
      const CustomIcon: LucideIcon = () => <span data-testid="custom-icon" />;
      return (
        <CategoryFilters
          value={value}
          onChange={setValue}
          items={[
            {
              id: 'custom',
              name: 'Custom',
              count: 1,
              icon: CustomIcon,
            },
          ]}
        />
      );
    };

    render(<CustomHarness />);

    expect(screen.getByRole('button', { name: /Custom/ })).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
