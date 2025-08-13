"use client";

import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";
// TypeScript: next-auth does not export these types directly in some versions. Use 'any' for providers if types are unavailable.
// import { BuiltInProviderType, LiteralUnion, ClientSafeProvider } from "next-auth";

type ProvidersMap = NonNullable<Awaited<ReturnType<typeof getProviders>>>;
import SignInForm from '@/components/auth/SignInForm';

interface Props {
  callbackUrl: string;
}

export default function SignInProviders({ callbackUrl }: Props) {
  const [providers, setProviders] = useState<ProvidersMap | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const prov = await getProviders();
        if (active) setProviders(prov ?? null);
      } catch (err) {
        console.error("Failed to load auth providers", err);
        if (active) setProviders(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SignInForm providers={providers} callbackUrl={callbackUrl} />
  );
}
