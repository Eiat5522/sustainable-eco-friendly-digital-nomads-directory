import { redirect } from 'next/navigation';
import { getBaseUrl } from '@/lib/absolute-url';
import { auth } from '@/lib/auth';
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl';
import SignupPageContent from './SignupPageContent';

type SignupPageSearchParams = Readonly<{ callbackUrl?: string | string[] }>;

type SignupPageProps = Readonly<{
  searchParams?: SignupPageSearchParams | Promise<SignupPageSearchParams>;
}>;

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await auth();
  const sp = await Promise.resolve(searchParams ?? {});
  const rawCallback = Array.isArray(sp.callbackUrl) ? sp.callbackUrl[0] : sp.callbackUrl;

  if (session) {
    let baseOrigin: string | undefined;
    try {
      baseOrigin = await getBaseUrl();
    } catch {
      baseOrigin = undefined;
    }
    const safeCallback = sanitizeCallbackUrl(rawCallback, baseOrigin);
    redirect(safeCallback ?? '/');
  }

  return <SignupPageContent />;
}
