export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="font-bold text-xl">
            Sustainable Nomads
          </a>
        </div>
        <nav className="hidden sm:flex items-center gap-4">
          {/* Placeholder nav items - to be implemented */}
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            Spaces
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
