'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { metadata } from './metadata';

function getErrorMessage(error: string | null) {
  switch (error) {
    case 'Configuration':
      return 'There is a problem with the server configuration.';
    case 'AccessDenied':
      return 'You do not have permission to sign in.';
    case 'Verification':
      return 'The verification link is invalid or has expired.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'OAuthAccountNotLinked':
    case 'EmailCreateAccount':
    case 'Callback':
    case 'EmailSignin':
    case 'CredentialsSignin':
      return 'There was a problem with your sign in.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return 'An unexpected error occurred.';
  }
}

function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Authentication Error</h1>
          <div className="my-6 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="mt-2 text-base text-gray-600">
            {errorMessage}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Error code: {error || 'unknown'}
          </p>
        </div>
        <div className="mt-8 flex flex-col space-y-4">
          <Link href="/auth/signin" className="text-green-600 hover:text-green-500 font-medium flex items-center justify-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Return to sign in</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-500 font-medium flex items-center justify-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Go to homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthErrorPage;
