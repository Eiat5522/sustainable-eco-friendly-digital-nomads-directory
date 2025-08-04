import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/images/logo/Leaf_and_Laptop_Logo.png"
      alt="Leaf & Laptop Logo"
      width={56}
      height={56}
      style={{
        width: '56px',
        height: '56px',
        objectFit: 'contain',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      priority
      className="rounded-full bg-white p-1"
    />
  );
}
