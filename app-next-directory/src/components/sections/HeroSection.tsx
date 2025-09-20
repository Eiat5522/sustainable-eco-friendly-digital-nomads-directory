'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { Search, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const [q, setQ] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    type SpeechRecognitionConstructor = new () => SpeechRecognition;

    const SpeechRecognitionCtor: SpeechRecognitionConstructor | undefined =
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const handleStart: EventListener = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    const handleResult: EventListener = (ev) => {
      const event = ev as unknown as { results: ArrayLike<{ 0?: { transcript?: string } }> };
      const transcript = Array.from(event.results)
        .map((res) => res[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) setQ(transcript);
    };

    const handleError: EventListener = (ev) => {
      const err = (ev as unknown as { error?: string }).error ?? 'unknown';
      const message = (() => {
        switch (err) {
          case 'not-allowed':
            return 'Microphone access was blocked. Enable it to use voice search.';
          case 'no-speech':
            return 'No speech was detected. Please try again.';
          case 'service-not-allowed':
            return 'Voice search is unavailable in this browser.';
          default:
            return 'Voice search stopped unexpectedly. Please try again.';
        }
      })();
      setVoiceError(message);
    };

    const handleEnd: EventListener = () => {
      setIsListening(false);
    };

    recognition.addEventListener('start', handleStart);
    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
  recognition.removeEventListener('start', handleStart);
  recognition.removeEventListener('result', handleResult);
  recognition.removeEventListener('error', handleError);
  recognition.removeEventListener('end', handleEnd);
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      setVoiceError(null);
      recognition.start();
    } catch {
      setVoiceError('Voice search could not be started. Please try again.');
      recognition.stop();
    }
  };

  return (
    <section
      className="relative min-h-[600px] bg-gradient-to-br from-neo-primary via-blue-600 to-blue-800 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Geometric Shapes */}
      <div
        className="absolute top-20 left-20 w-32 h-32 bg-neo-secondary rounded-full opacity-80"
        aria-hidden="true"
        role="presentation"
      >
        <div className="absolute inset-4 bg-neo-border rounded-full"></div>
        <div className="absolute top-8 left-8 w-4 h-16 bg-neo-border rounded-full"></div>
        <div className="absolute top-8 right-8 w-4 h-16 bg-neo-border rounded-full"></div>
        <div className="absolute top-4 left-12 w-4 h-16 bg-neo-border rounded-full transform rotate-45"></div>
        <div className="absolute top-4 right-12 w-4 h-16 bg-neo-border rounded-full transform -rotate-45"></div>
        <div className="absolute bottom-4 left-12 w-4 h-16 bg-neo-border rounded-full transform -rotate-45"></div>
        <div className="absolute bottom-4 right-12 w-4 h-16 bg-neo-border rounded-full transform rotate-45"></div>
      </div>
      <div className="absolute top-32 right-20 w-24 h-24 bg-pink-400 transform rotate-45">
        <div className="absolute inset-2 bg-neo-border"></div>
      </div>

      {/* Dashed divider */}
      <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-neo-border opacity-60"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 id="hero-heading" className="heading-xl text-white mb-6">
            A Curated Directory For Sustainable Digital Nomads
          </h1>
          <p className="body-lg text-blue-100 mb-12 max-w-2xl mx-auto">
            The growing source for all sustainable venues is empowered by the
            community to ensure you will get the most eco-friendly spaces for
            your digital nomad journey.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search
                aria-hidden="true"
                focusable="false"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neo-text-secondary"
                size={20}
              />
              <NeoInput
                id="hero-search"
                type="search"
                aria-label="Search venues"
                placeholder="Search 3,200+ sustainable venues"
                className="pl-12 pr-16 h-16 text-lg bg-white"
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <NeoButton type="submit" className="absolute right-12 top-1/2 -translate-y-1/2" size="md">
                Search
              </NeoButton>
              <button
                type="button"
                aria-label={voiceSupported ? (isListening ? 'Stop voice search' : 'Start voice search') : 'Voice search not supported'}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!voiceSupported}
                onClick={toggleVoiceSearch}
                aria-pressed={isListening}
                title={voiceSupported ? (isListening ? 'Stop voice search' : 'Start voice search') : 'Voice search is not supported in this browser'}
              >
                <Mic
                  aria-hidden="true"
                  focusable="false"
                  className={isListening ? 'text-white' : 'text-neo-text-secondary'}
                  size={20}
                />
              </button>
            </div>
            <div className="sr-only" aria-live="polite">
              {isListening ? 'Listening for your search query.' : voiceError ? voiceError : voiceSupported ? 'Voice search ready.' : 'Voice search not supported.'}
            </div>
            {voiceError && (
              <p className="mt-2 text-sm text-red-200" role="alert">
                {voiceError}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
