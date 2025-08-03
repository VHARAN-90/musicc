import React, { useState } from 'react';
import { Search, Loader2, Mic, MicOff } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');
  
  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript);
    if (transcript.trim()) {
      onSearch(transcript.trim());
    }
  };

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceSearch(handleVoiceResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="mb-4 md:mb-6">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 md:space-x-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={isListening ? transcript : query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening... Speak now!" : "Search for songs, artists, or playlists"}
            className={`w-full pl-10 md:pl-12 pr-16 md:pr-20 py-2.5 md:py-3 text-sm md:text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/50 focus:border-transparent transition-all duration-200 ${
              isListening ? 'ring-2 ring-red-500/50 border-red-500/30' : ''
            }`}
            disabled={isLoading}
          />
          <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-gray-300 animate-spin" />
            ) : (
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />
            )}
          </div>
          <button
            type="submit"
            disabled={(!query.trim() && !transcript.trim()) || isLoading}
            className="absolute right-1.5 md:right-2 top-1/2 transform -translate-y-1/2 px-2 md:px-4 py-1 md:py-1.5 bg-gradient-to-r from-[#FF3CAC] to-[#784BA0] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#FF3CAC]/80 hover:to-[#784BA0]/80 transition-all duration-200 text-xs md:text-sm font-medium"
          >
            Search
          </button>
        </div>
        
        {isSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={isLoading}
            className={`p-2.5 md:p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25'
                : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 border border-white/20'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice search'}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Mic className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </button>
        )}
      </form>
      
      {isListening && (
        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-xs md:text-sm font-medium">
              Listening... Speak clearly to search for music
            </span>
          </div>
          {transcript && (
            <div className="mt-1 md:mt-2 text-white text-xs md:text-sm">
              "{transcript}"
            </div>
          )}
        </div>
      )}
      
      {!isSupported && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
          <span className="text-yellow-400 text-xs">
            Voice search is not supported in your browser
          </span>
        </div>
      )}
    </div>
  );
};