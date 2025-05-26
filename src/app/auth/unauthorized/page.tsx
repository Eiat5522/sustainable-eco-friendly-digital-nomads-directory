// Unauthorized access page
import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized Access - Eco-Friendly Digital Nomads',
  description: 'You do not have permission to access this resource',
};

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Access Denied</h1>
          <div className="my-6 flex justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-24 w-24 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2M9 9h2M9 19h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm3-14V3a2 2 0 012-2v0a2 2 0 012 2v2m-6 0V3a2 2 0 00-2-2v0a2 2 0 00-2 2v2" 
              />
            </svg>
          </div>
          <p className="mt-2 text-base text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            If you believe this is an error, please contact the administrator.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-green-600 hover:text-green-500 font-medium flex items-center justify-center space-x-2">
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            <span>Return to homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
