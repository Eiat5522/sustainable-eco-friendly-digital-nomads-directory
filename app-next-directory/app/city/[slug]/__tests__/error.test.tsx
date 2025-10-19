import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockReset = jest.fn();

import CityError from '../error';

describe('CityError boundary', () => {
  it('renders the fallback UI with retry controls and error details in non-production environments', async () => {
    const { default: CityError } = await import('../error');

    render(
      <CityError
        error={new Error('Boom')}
        reset={mockReset}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong loading this city' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full Refresh' })).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('invokes the provided reset handler when the retry button is activated', async () => {
    const { default: CityError } = await import('../error');
    const user = userEvent.setup();

    render(
      <CityError
        error={new Error('Boom')}
        reset={mockReset}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('triggers a full reload using window.location.reload when requested', async () => {
    const { default: CityError } = await import('../error');
    const user = userEvent.setup();
    const reloadSpy = jest.spyOn(window.location, 'reload');

    render(
      <CityError
        error={new Error('Boom')}
        reset={mockReset}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Full Refresh' }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('hides implementation details when running in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const { default: CityError } = await import('../error');

    render(
      <CityError
        error={new Error('Hidden')}
        reset={mockReset}
      />
    );

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    process.env.NODE_ENV = NODE_ENV;
  });
});
