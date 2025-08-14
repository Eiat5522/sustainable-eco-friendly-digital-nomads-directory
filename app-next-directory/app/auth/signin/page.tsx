import type { Metadata } from 'next';
import SignInProviders from './SignInProviders';

export const metadata: Metadata = {
  title: 'Sign In - Eco-Friendly Digital Nomads',
  description: 'Sign in to your account on the Sustainable Eco-Friendly Digital Nomads Directory',
};

function SignInPage({
  searchParams,
}: {
  // Next.js App Router passes `searchParams` as a plain object, not a Promise.
  searchParams?: { callbackUrl?: string | string[]; error?: string | string[] };
}) {
  // This is a Server Component; derive values synchronously and pass to the client component.
  const rawCallback =
    Array.isArray(searchParams?.callbackUrl)
      ? searchParams?.callbackUrl?.[0]
      : searchParams?.callbackUrl;
  // Prevent open redirects: only allow same-origin relative paths.
  const callbackUrl =
    typeof rawCallback === 'string' &&
    rawCallback.startsWith('/') &&
    !rawCallback.startsWith('//')
      ? rawCallback
      : '/';
  const rawError =
    Array.isArray(searchParams?.error)
      ? searchParams?.error?.[0]
      : searchParams?.error;
  const error = typeof rawError === 'string' ? rawError : undefined;  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-600">
            Access your eco-friendly digital nomad profile
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error === 'CredentialsSignin' 
                ? 'Invalid email or password'
                : error === 'OAuthAccountNotLinked'
                ? 'This email is already used with a different sign-in method'
                : 'An error occurred during sign in'}
            </div>
          )}
        </div>
        <SignInProviders callbackUrl={callbackUrl} error={error} />
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-green-600 hover:text-green-500 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;