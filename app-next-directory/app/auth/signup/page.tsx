import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getBaseUrl } from '@/lib/absolute-url';
import { auth } from '@/lib/auth';
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl';
import SignupPageContent from './SignupPageContent';

type SignupPageSearchParams = Readonly<{ callbackUrl?: string | string[] }>;

type SignupPageProps = Readonly<{
  searchParams?: SignupPageSearchParams | Promise<SignupPageSearchParams>;
}>;

export default async function SignupPage(props: SignupPageProps) {
  const searchParams = await props.searchParams;

  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<ReturnType<typeof headers>>
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

  return <SignupPageContent />;
}
