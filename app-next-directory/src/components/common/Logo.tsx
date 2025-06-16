import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/images/logo/Leaf_and_Laptop_Logo.png"
      alt="Leaf & Laptop Logo"
      width={48}
      height={48}
      style={{
        width: '48px',
        height: '48px',
        objectFit: 'contain'
      }}
      priority
      className="rounded-full bg-white p-1"
    />
  );
}
