import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white py-6 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Sustainable Nomads. All rights reserved.
    </footer>
  );
}
