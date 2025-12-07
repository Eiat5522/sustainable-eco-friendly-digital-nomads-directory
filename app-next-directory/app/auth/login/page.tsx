import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
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
  let _h = null as null | Awaited<ReturnType<typeof headers>> | { get(name: string): string | null | undefined };
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
      <Header />
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background accents */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-br from-neo-secondary/10 via-white to-neo-primary/10"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neo-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neo-secondary/10 blur-3xl"
        />
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-center p-8 rounded-xl neo-card bg-gradient-to-br from-white to-neo-secondary/5">
            <h2 className="heading-lg mb-3" id="welcome-heading">
              Welcome back
            </h2>
            <p className="body-md">
              Log in to manage your listings, save favorites, and discover eco-friendly spots for
              digital nomads.
            </p>
            <section className="mt-8" aria-labelledby="social-signin-heading-left">
              <h3 id="social-signin-heading-left" className="sr-only">
                Social sign-in options
              </h3>
              <SocialAuthRow />
            </section>
          </div>
          {/* Auth card */}
          <NeoCard className="p-8 md:p-10">
            <NeoCardHeader>
              <NeoCardTitle>Log in</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <LoginForm />
              <section className="mt-6 md:hidden" aria-labelledby="social-signin-heading-mobile">
                <h3 id="social-signin-heading-mobile" className="sr-only">
                  Social sign-in options
                </h3>
                <SocialAuthRow />
              </section>
              <p className="mt-6 text-sm text-center">
                New user?{' '}
                <Link
                  href="/auth/signup"
                  className="text-neo-primary hover:underline focus-visible:underline underline-offset-2"
                >
                  Create an account
                </Link>
              </p>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
      <Footer />
    </>
  );
}
