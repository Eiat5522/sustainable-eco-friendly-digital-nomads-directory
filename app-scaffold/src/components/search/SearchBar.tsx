import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Search, X } from 'lucide-react';
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

  useClickOutside(containerRef, () => setIsFocused(false));

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   placeholder-gray-500 dark:placeholder-gray-400"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {value && (
            <button
              onClick={() => onChange('')}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  <motion.li
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                               text-gray-900 dark:text-gray-100"
                    >
                      {suggestion}
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
