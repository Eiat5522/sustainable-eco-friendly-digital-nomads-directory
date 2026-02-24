import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
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
      <Header />
      {/* Page background: bold amber with black dot grid */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-neo-secondary overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Bold floating shapes */}
        <div className="absolute top-10 left-10 w-28 h-28 bg-neo-primary border-4 border-neo-border shadow-[8px_8px_0px_0px] shadow-neo-shadow -rotate-12 z-0" />
        <div className="absolute top-14 right-14 w-20 h-20 bg-neo-accent border-4 border-neo-border shadow-[6px_6px_0px_0px] shadow-neo-shadow rounded-full z-0 animate-[spin_12s_linear_infinite]" />
        <div className="absolute bottom-14 left-20 w-16 h-16 bg-neo-success border-4 border-neo-border shadow-[5px_5px_0px_0px] shadow-neo-shadow rotate-45 z-0" />
        <div className="absolute bottom-10 right-10 w-36 h-36 bg-neo-border border-4 border-neo-secondary rounded-full z-0" />
        <div className="absolute top-1/3 right-4 w-8 h-32 bg-neo-border opacity-30 z-0" />
        <div className="absolute top-1/4 left-4 w-8 h-24 bg-neo-border opacity-20 z-0" />

        {/* Two-panel card */}
        <div
          className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row border-4 border-neo-border bg-neo-surface overflow-hidden"
          style={{ boxShadow: '14px 14px 0px 0px var(--neo-shadow)' }}
        >
          {/* Left Panel — black, bold */}
          <div className="flex w-full flex-col justify-center bg-neo-border p-8 md:w-2/5 lg:p-12 relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-neo-border">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-neo-secondary opacity-20 rounded-full" />
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-neo-primary opacity-20 rotate-45" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <span className="text-3xl" aria-hidden>🌿</span>
                <span className="font-black text-neo-secondary text-sm uppercase tracking-[0.2em]">EcoNomad</span>
              </div>
              <p className="heading-xl text-white uppercase tracking-tight mb-5" id="welcome-heading">
                Welcome<br />Back!
              </p>
              <p className="font-bold text-neo-secondary/80 mb-8 max-w-xs text-sm leading-relaxed">
                Log in to manage listings, save favourites, and discover eco-friendly spots built for digital nomads.
              </p>
              <section
                aria-labelledby="social-signin-heading-left"
                className="border-2 border-white/20 bg-white/5 p-5"
              >
                <h3
                  id="social-signin-heading-left"
                  className="text-xs font-black uppercase tracking-[0.15em] mb-4 text-neo-secondary"
                >
                  Quick Sign In
                </h3>
                <SocialAuthRow />
              </section>
            </div>
          </div>

          {/* Right Panel — white, form */}
          <div className="w-full p-8 md:w-3/5 lg:p-12 bg-neo-surface flex flex-col justify-center">
            <div className="mb-8">
              <div className="inline-block bg-neo-primary text-white font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 border-2 border-neo-border shadow-[3px_3px_0_0] shadow-neo-shadow mb-5">
                Member Access
              </div>
              <h1 className="heading-lg mb-2">Log In</h1>
              <p className="text-neo-text-secondary font-medium text-sm">Enter your credentials to access your account.</p>
            </div>

            <LoginForm />

            <div className="mt-8 pt-6 border-t-4 border-dashed border-neo-border text-center">
              <p className="font-bold text-neo-text-primary text-sm">
                New user?{' '}
                <Link
                  href="/auth/signup"
                  className="inline-block ml-2 px-4 py-1.5 bg-neo-secondary text-neo-border font-bold border-2 border-neo-border shadow-[3px_3px_0_0] shadow-neo-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all uppercase text-xs tracking-wider"
                >
                  Create account →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
