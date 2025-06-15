import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/images/logo/Leaf_and_Laptop_Logo.png"
      alt="Leaf & Laptop Logo"
      width={40}
      height={40}
      priority
      className="rounded-full bg-white"
    />
  );
}
