import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/images/logo/leaf_and_laptop_logo.png"
      alt="EcoNomads Logo"
      width={40}
      height={40}
      priority
      className="rounded-full bg-white"
    />
  );
}
