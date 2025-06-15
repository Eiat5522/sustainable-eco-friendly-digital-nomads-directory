'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex justify-end p-4 bg-gray-100">
      <Link href="/api/auth/signin">
        <button className="px-4 py-2 bg-blue-600 text-white rounded shadow">
          Login
        </button>
      </Link>
    </header>
  );
}
