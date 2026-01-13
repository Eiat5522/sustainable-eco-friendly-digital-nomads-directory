import { connection } from 'next/server';
import { Suspense } from 'react'

export async function FooterYear() {
  await connection()
  const year = new Date().getFullYear();
  return <Suspense fallback={<div> Loading... </div>}>
     <span data-testid="footer-year">{year}</span>
  </Suspense>
}
