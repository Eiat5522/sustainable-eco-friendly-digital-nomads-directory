import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '403 - Forbidden',
  description: 'Access to this resource is forbidden',
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <ShieldAlert className="h-24 w-24 text-red-500" aria-hidden="true" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Access Forbidden
        </h2>
        
        <p className="text-gray-600 mb-8">
          Sorry, you don&apos;t have permission to access this resource.
          Please contact an administrator if you believe this is an error.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Error Code: 403</p>
          <p>If you need assistance, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
