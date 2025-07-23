// Sign-up page component
import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Create Account - Eco-Friendly Digital Nomads',
  description: 'Create a new account on the Sustainable Eco-Friendly Digital Nomads Directory',
};

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join the eco-friendly digital nomad community
          </p>
        </div>

        <SignUpForm />

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-green-600 hover:text-green-500 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
