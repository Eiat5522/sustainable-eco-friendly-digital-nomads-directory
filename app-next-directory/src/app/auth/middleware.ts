"use client";
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { auth } from '@/lib/auth';

export { auth as middleware } from "@/lib/auth";

export const config = {
  // This matcher ensures the middleware runs *only* for the /auth/profile path.
  // Paths are relative to the app\'s root.
  matcher: ['/auth/profile'],
};
