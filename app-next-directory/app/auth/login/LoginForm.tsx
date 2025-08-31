"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { NeoInput } from "@/components/ui/neo-input";
import { NeoButton } from "@/components/ui/neo-button";
import SocialAuthRow from "@/components/auth/SocialAuthRow";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const callbackUrl = searchParams.get("callbackUrl") ?? "/";
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(
          res.error === "CredentialsSignin"
            ? "Invalid email or password."
            : "Unable to sign in. Please try again."
        );
        return;
      }
      // Prefer router navigation if a URL is present
      if (res?.url) router.replace(res.url);
      else router.replace(callbackUrl);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "form-error" : undefined}>
        <NeoInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email"
          disabled={isLoading}
          aria-disabled={isLoading}
          
        />
        <NeoInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          aria-label="Password"
          disabled={isLoading}
          aria-disabled={isLoading}
        />
        {error ? (
          <p id="form-error" role="alert" aria-live="polite" className="text-red-500 text-sm">
            {error}
          </p>
        ) : null}
        <NeoButton type="submit" className="w-full" disabled={isLoading} aria-disabled={isLoading}>
          {isLoading ? "Signing in…" : "Login"}
        </NeoButton>
      </form>


      <div className="mt-6" aria-labelledby="social-signin-heading">
        <div className="relative flex items-center">
          <div className="flex-1 h-px bg-neo-border" />
          <span id="social-signin-heading" className="px-3 text-xs text-neo-text-secondary">
            or continue with
          </span>
          <div className="flex-1 h-px bg-neo-border" />
        </div>
        <div className="mt-4">
          <SocialAuthRow />
        </div>
      </div>
    </div>
  );
}

