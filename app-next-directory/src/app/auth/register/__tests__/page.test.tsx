import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegisterPage from '../page';

type MockFetchResponse = {
  ok: boolean;
  json: jest.Mock<Promise<unknown>, []>;
};

describe('RegisterPage', () => {
  const fetchMock = jest.fn<Promise<MockFetchResponse>, any>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () => render(<RegisterPage />);

  const fillAndSubmitForm = async ({
    name = 'Taylor Test',
    email = 'taylor@example.com',
    password = 'supersecret',
  } = {}) => {
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Your name'), name);
    await user.type(screen.getByPlaceholderText('you@example.com'), email);
    await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), password);
    await user.click(screen.getByRole('button', { name: /create account/i }));
  };

  it('renders the registration form with interactive inputs', async () => {
    renderPage();

    const nameField = screen.getByPlaceholderText('Your name');
    const emailField = screen.getByPlaceholderText('you@example.com');
    const passwordField = screen.getByPlaceholderText('Password (min 8 chars)');

    const user = userEvent.setup();
    await user.type(nameField, 'Patricia');
    await user.type(emailField, 'patricia@example.com');
    await user.type(passwordField, 'patricia123');

    expect(nameField).toHaveValue('Patricia');
    expect(emailField).toHaveValue('patricia@example.com');
    expect(passwordField).toHaveValue('patricia123');
  });

  it('submits registration details and shows success without verification requirement', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ emailVerificationRequired: false }),
    });

    renderPage();
    await fillAndSubmitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Taylor Test',
            email: 'taylor@example.com',
            password: 'supersecret',
          }),
        })
      );
    });

    expect(await screen.findByText(/your account is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/you can sign in right away/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to sign in/i })).toHaveAttribute('href', '/auth/login');
  });

  it('shows email verification instructions when required', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ emailVerificationRequired: true }),
    });

    renderPage();
    await fillAndSubmitForm();

    expect(
      await screen.findByText(/check your inbox to verify your email/i)
    ).toBeInTheDocument();
  });

  it('displays server provided error messages and resets button state on failure', async () => {
    const jsonMock = jest.fn().mockResolvedValue({ error: 'Email already registered' });
    fetchMock.mockResolvedValueOnce({ ok: false, json: jsonMock });

    renderPage();
    await fillAndSubmitForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).toHaveTextContent('Create account');
    });
    expect(jsonMock).toHaveBeenCalled();
  });

  it('falls back to default error message when server response cannot be parsed', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: jest.fn().mockRejectedValue(new Error('bad payload')) });

    renderPage();
    await fillAndSubmitForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed');
  });

  it('handles unexpected rejection values gracefully', async () => {
    fetchMock.mockRejectedValueOnce('network went away');

    renderPage();
    await fillAndSubmitForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create account. Try again.');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).toHaveTextContent('Create account');
    });
  });
});
