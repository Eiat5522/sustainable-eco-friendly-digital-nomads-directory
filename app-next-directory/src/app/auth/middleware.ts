"use client";
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export { auth as middleware } from "@/lib/auth";

export const config = {
  // This matcher ensures the middleware runs *only* for the /auth/profile path.
  // Paths are relative to the app\'s root.
  matcher: ['/auth/profile'],
};
