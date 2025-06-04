import Link from 'next/link';

export default function MainNav() {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        {/* <li>
          <Link href="/listings">Listings</Link>
        </li> */}
        <li>
          <Link href="/cities">Cities</Link>
        </li>
        {/* ...existing code... */}
      </ul>
    </nav>
  );
}
