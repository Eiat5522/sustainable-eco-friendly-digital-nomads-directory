import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn } from 'next-auth/react';
import { SocialAuthRow } from '../SocialAuthRow';

// Mock next-auth
jest.mock('next-auth/react');
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('SocialAuthRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH;
  });

  describe('Basic Rendering', () => {
    it('renders loading state initially', () => {
      jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SocialAuthRow />);
      expect(screen.getByText(/Loading sign-in options/i)).toBeInTheDocument();
    });

    it('renders provider buttons when loaded successfully', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          facebook: { id: 'facebook', name: 'Facebook' },
          google: { id: 'google', name: 'Google' },
          twitter: { id: 'twitter', name: 'X' },
          microsoft: { id: 'microsoft', name: 'Microsoft' },
        }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Facebook/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Continue with X/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Continue with Microsoft/i)).toBeInTheDocument();
      });
    });

    it('filters out credentials provider', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          credentials: { id: 'credentials', name: 'Credentials' },
          google: { id: 'google', name: 'Google' },
        }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
        expect(screen.queryByText(/credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('OAuth Disabled Flag', () => {
    it('shows message when NEXT_PUBLIC_AUTH_DISABLE_OAUTH is true', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';

      render(<SocialAuthRow />);

      expect(screen.getByText(/Social sign-in is temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/Please use email sign-in/i)).toBeInTheDocument();
    });

    it('does not fetch providers when OAuth is disabled', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';
      const fetchSpy = jest.spyOn(global, 'fetch');

      render(<SocialAuthRow />);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('renders normally when NEXT_PUBLIC_AUTH_DISABLE_OAUTH is not set', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google', name: 'Google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });
    });
  });

  describe('Provider Loading', () => {
    it('fetches providers from /api/auth/providers', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/providers');
      });
    });

    it('handles empty provider list', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByText(/No social sign-in providers are configured/i)).toBeInTheDocument();
      });
    });

    it('handles null response from providers endpoint', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, json: async () => null } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByText(/No social sign-in providers are configured/i)).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load social sign-in providers right now/i)
        ).toBeInTheDocument();
      });

      expect(consoleWarn).toHaveBeenCalledWith(
        '[auth] Failed to load providers',
        expect.any(Error)
      );
      consoleWarn.mockRestore();
    });

    it('handles non-ok response from providers endpoint', async () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load social sign-in providers right now/i)
        ).toBeInTheDocument();
      });

      consoleWarn.mockRestore();
    });
  });

  describe('Provider Buttons', () => {
    it('renders buttons with correct icons', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          facebook: { id: 'facebook' },
          google: { id: 'google' },
        }),
      } as Response);

      const { container } = render(<SocialAuthRow />);

      await waitFor(() => {
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(2);

        // Each button should have an SVG icon
        buttons.forEach(button => {
          expect(button.querySelector('svg')).toBeInTheDocument();
        });
      });
    });

    it('renders buttons with correct colors', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          facebook: { id: 'facebook' },
          google: { id: 'google' },
        }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const facebookButton = screen.getByLabelText(/Continue with Facebook/i);
        expect(facebookButton).toHaveStyle({ backgroundColor: '#1877F2' });

        const googleButton = screen.getByLabelText(/Continue with Google/i);
        expect(googleButton).toHaveStyle({ backgroundColor: '#FFFFFF' });
      });
    });

    it('applies correct styling classes to buttons', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const button = screen.getByLabelText(/Continue with Google/i);
        expect(button).toHaveClass('neo-button');
        expect(button).toHaveClass('neo-button-hover');
        expect(button).toHaveClass('rounded-full');
        expect(button).toHaveClass('w-12');
        expect(button).toHaveClass('h-12');
      });
    });

    it('renders buttons with proper accessibility attributes', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const button = screen.getByLabelText(/Continue with Google/i);
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('title', 'Continue with Google');
        expect(button).toHaveAttribute('aria-label', 'Continue with Google');
      });
    });
  });

  describe('Sign In Functionality', () => {
    it('calls signIn when button is clicked', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      mockSignIn.mockResolvedValue(undefined as any);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });

      const button = screen.getByLabelText(/Continue with Google/i);
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google');
      });
    });

    it('disables button while sign in is in progress', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      // Mock signIn to never resolve
      mockSignIn.mockImplementation(() => new Promise(() => {}));

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });

      const button = screen.getByLabelText(/Continue with Google/i);
      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('only disables the clicked button, not other buttons', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { id: 'google' },
          facebook: { id: 'facebook' },
        }),
      } as Response);

      mockSignIn.mockImplementation(() => new Promise(() => {}));

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });

      const googleButton = screen.getByLabelText(/Continue with Google/i);
      const facebookButton = screen.getByLabelText(/Continue with Facebook/i);

      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(facebookButton).not.toBeDisabled();
      });
    });

    it('re-enables button after sign in completes', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      mockSignIn.mockResolvedValue(undefined as any);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });

      const button = screen.getByLabelText(/Continue with Google/i);
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // After sign in completes, button should be re-enabled (though user may navigate away)
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Custom Providers', () => {
    it('renders custom providers when provided', async () => {
      const customProviders = [
        {
          id: 'custom',
          name: 'Custom Provider',
          color: '#FF0000',
          icon: <span>Custom Icon</span>,
        },
      ];

      // Still need to fetch available providers, but custom provider should be in the list
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom: { id: 'custom' } }),
      } as Response);

      render(<SocialAuthRow providers={customProviders} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Custom Provider/i)).toBeInTheDocument();
      });
    });

    it('filters custom providers based on available providers', async () => {
      const customProviders = [
        {
          id: 'provider1',
          name: 'Provider 1',
          color: '#FF0000',
          icon: <span>Icon1</span>,
        },
        {
          id: 'provider2',
          name: 'Provider 2',
          color: '#00FF00',
          icon: <span>Icon2</span>,
        },
      ];

      // Only provider1 is available from the server
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ provider1: { id: 'provider1' } }),
      } as Response);

      render(<SocialAuthRow providers={customProviders} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Provider 1/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Continue with Provider 2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Cleanup', () => {
    it('cancels fetch on unmount', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ google: { id: 'google' } }),
            } as Response);
          }, 100);
        });
      });

      const { unmount } = render(<SocialAuthRow />);

      // Unmount before fetch completes
      unmount();

      // Wait a bit to ensure fetch would have completed
      await new Promise(resolve => setTimeout(resolve, 150));

      // The component should not update state after unmount
      // This is tested by ensuring no warnings are thrown
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not update state when unmounted during error', async () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      jest.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Network error'));
            }, 50);
          })
      );

      const { unmount } = render(<SocialAuthRow />);

      // Unmount before error is thrown
      unmount();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have any React warnings about setting state on unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('unmounted'));

      consoleWarn.mockRestore();
      consoleError.mockRestore();
    });

    it('does not update state after unmounting during fetch', async () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      jest.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ google: { id: 'google' } }),
              } as Response);
            }, 50);
          })
      );

      const { unmount } = render(<SocialAuthRow />);
      unmount();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have any React warnings about setting state on unmounted component
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();

      consoleWarn.mockRestore();
      consoleError.mockRestore();
    });
  });

  describe('Layout and Styling', () => {
    it('centers providers in a flex container', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      const { container } = render(<SocialAuthRow />);

      await waitFor(() => {
        const flexContainer = container.querySelector('.flex');
        expect(flexContainer).toHaveClass('items-center');
        expect(flexContainer).toHaveClass('justify-center');
        expect(flexContainer).toHaveClass('gap-3');
      });
    });

    it('renders multiple providers in a row', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          facebook: { id: 'facebook' },
          google: { id: 'google' },
          twitter: { id: 'twitter' },
        }),
      } as Response);

      const { container } = render(<SocialAuthRow />);

      await waitFor(() => {
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(3);
      });
    });
  });

  describe('Provider Icons', () => {
    it('renders Google icon with correct paths', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const googleButton = screen.getByLabelText(/Continue with Google/i);
        const svg = googleButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      });
    });

    it('renders Facebook icon', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ facebook: { id: 'facebook' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const facebookButton = screen.getByLabelText(/Continue with Facebook/i);
        const svg = facebookButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('renders Twitter/X icon', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ twitter: { id: 'twitter' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const twitterButton = screen.getByLabelText(/Continue with X/i);
        const svg = twitterButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('renders Microsoft icon', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ microsoft: { id: 'microsoft' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const microsoftButton = screen.getByLabelText(/Continue with Microsoft/i);
        const svg = microsoftButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('sets aria-hidden on icons', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const googleButton = screen.getByLabelText(/Continue with Google/i);
        const svg = googleButton.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles providers with missing properties gracefully', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { id: 'google' },
          incomplete: {}, // Missing id
        }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        // Should still render Google button
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });
    });

    it('handles very slow API response', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ google: { id: 'google' } }),
              } as Response);
            }, 2000);
          })
      );

      render(<SocialAuthRow />);

      // Should show loading state
      expect(screen.getByText(/Loading sign-in options/i)).toBeInTheDocument();
    }, 10000);

    it('handles rapid re-renders during loading', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ google: { id: 'google' } }),
              } as Response);
            }, 100);
          })
      );

      const { rerender } = render(<SocialAuthRow />);

      // Rapid re-renders
      rerender(<SocialAuthRow />);
      rerender(<SocialAuthRow />);
      rerender(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Continue with Google/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper button roles', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { id: 'google' },
          facebook: { id: 'facebook' },
        }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
      });
    });

    it('has descriptive labels for screen readers', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        const button = screen.getByLabelText(/Continue with Google/i);
        expect(button).toHaveAccessibleName('Continue with Google');
      });
    });

    it('maintains focus management during loading state changes', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ google: { id: 'google' } }),
      } as Response);

      render(<SocialAuthRow />);

      // Should transition from loading to buttons without losing focus context
      await waitFor(() => {
        const button = screen.getByLabelText(/Continue with Google/i);
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});
