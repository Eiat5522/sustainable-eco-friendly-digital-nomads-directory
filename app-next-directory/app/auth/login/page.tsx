import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { FooterServer } from '@/components/layout/FooterServer';
import { HeaderServer } from '@/components/layout/HeaderServer';
import { getBaseUrl } from '@/lib/absolute-url';
import { auth } from '@/lib/auth';
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl';
import LoginForm from './LoginForm';

type LoginPageSearchParams = Readonly<{ callbackUrl?: string | string[] }>;

type LoginPageProps = Readonly<{
  searchParams?: LoginPageSearchParams | Promise<LoginPageSearchParams>;
}>;

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;

  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<Awaited<ReturnType<typeof headers>>>
    | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
  } catch {
    _h = null;
  }

  const session = await auth(_h);
  const sp = await Promise.resolve(searchParams ?? {});
  const rawCallback = Array.isArray(sp.callbackUrl) ? sp.callbackUrl[0] : sp.callbackUrl;

  if (session) {
    let baseOrigin: string | undefined;
    try {
      baseOrigin = await getBaseUrl(_h);
    } catch {
      baseOrigin = undefined;
    }
    const safeCallback = sanitizeCallbackUrl(rawCallback, baseOrigin);
    redirect(safeCallback ?? '/');
  }

  return (
    <>
      <HeaderServer />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
        {/* Geometric Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--color-neo-border) 2px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative shapes */}
        <div className="absolute top-12 left-12 w-32 h-32 bg-neo-accent border-4 border-neo-border rounded-full shadow-[8px_8px_0px_0px] shadow-neo-shadow -z-0 animate-[spin_10s_linear_infinite]" />
        <div className="absolute bottom-12 right-12 w-40 h-40 bg-neo-success border-4 border-neo-border shadow-[8px_8px_0px_0px] shadow-neo-shadow -z-0 rotate-12" />
        <div className="absolute top-1/4 right-24 w-16 h-16 bg-neo-primary border-4 border-neo-border shadow-[4px_4px_0px_0px] shadow-neo-shadow -z-0 -rotate-12" />

        <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row rounded-2xl border-4 border-neo-border shadow-[16px_16px_0px_0px] shadow-neo-shadow bg-neo-surface overflow-hidden">
          {/* Left Panel */}
          <div className="flex w-full flex-col justify-center bg-neo-secondary p-8 md:w-1/2 lg:p-12 border-b-4 md:border-b-0 md:border-r-4 border-neo-border relative overflow-hidden">
            {/* Inner decorative elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-neo-primary rounded-full border-4 border-neo-border opacity-50 mix-blend-multiply" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-neo-accent border-4 border-neo-border opacity-50 mix-blend-multiply rotate-45" />

            <div className="relative z-10">
              <h2
                className="heading-xl mb-6 text-neo-border uppercase tracking-tight"
                id="welcome-heading"
              >
                Welcome
                <br />
                Back!
              </h2>
              <p className="text-lg font-bold text-neo-border/80 mb-8 max-w-sm">
                Log in to manage your listings, save favorites, and discover eco-friendly spots for
                digital nomads.
              </p>
              <section
                aria-labelledby="social-signin-heading-left"
                className="bg-neo-surface p-6 rounded-xl border-4 border-neo-border shadow-[4px_4px_0px_0px] shadow-neo-shadow"
              >
                <h3
                  id="social-signin-heading-left"
                  className="text-sm font-bold uppercase tracking-wider mb-4 text-neo-text-primary"
                >
                  Quick Sign In
                </h3>
                <SocialAuthRow />
              </section>
            </div>
          </div>

          {/* Right Panel (Auth Card) */}
          <div className="w-full p-8 md:w-1/2 lg:p-12 bg-neo-surface flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="heading-lg mb-2">Log In</h1>
              <p className="text-neo-text-secondary font-medium">
                Enter your details to access your account.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 pt-6 border-t-4 border-neo-border border-dashed text-center">
              <p className="font-bold text-neo-text-primary">
                New user?{' '}
                <Link
                  href="/auth/signup"
                  className="inline-block ml-2 px-3 py-1 bg-neo-primary text-white border-2 border-neo-border shadow-[2px_2px_0px_0px] shadow-neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <FooterServer />
    </>
  );
}
