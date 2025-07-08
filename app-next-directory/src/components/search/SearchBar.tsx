import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  suggestions = [],
  isLoading = false,
  className = '',
  placeholder = 'Search eco-friendly spaces...'
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useClickOutside<HTMLDivElement>(containerRef, () => setIsFocused(false));

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognition.current = new window.webkitSpeechRecognition();
      if (recognition.current) {
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';
      }

      if (recognition.current) {
        recognition.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onChange(transcript);
          setIsListening(false);
        };

        recognition.current.onerror = () => {
          setIsListening(false);
        };

        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  };

  const handleVoiceSearch = () => {
    if (!recognition.current) {
      initializeSpeechRecognition();
    }

    if (recognition.current) {
      if (isListening) {
        recognition.current.stop();
      } else {
        setIsListening(true);
        recognition.current.start();
      }
    } else {
      alert('Voice search is not supported in your browser');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <input
            type="text"
            placeholder="Search destinations..."
            className="h-full flex-grow px-4 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-700 dark:text-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="h-full px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceSearch}
          className={cn(
            "p-1.5 rounded-full transition-colors duration-200",
            isListening
              ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          <Mic className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (suggestions.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg
                     border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading suggestions...
              </div>
            ) : (
              <ul className="py-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        aria-label={`Select suggestion: ${suggestion}`}
                        title={suggestion}
                      >
                        {suggestion}
                      </button>
                    </motion.div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
