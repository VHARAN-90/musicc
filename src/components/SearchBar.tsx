import React, { useState } from 'react';
import { Search, Loader2, Mic, MicOff, Clock, TrendingUp, Music } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { youtubeApi } from '../services/youtubeApi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recentSearches', []);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Popular search suggestions
  const popularSuggestions = [
    'Bollywood hits 2024',
    'AR Rahman songs',
    'Tamil melody songs',
    'Hindi romantic songs',
    'Arijit Singh songs',
    'Telugu hit songs',
    'Punjabi songs',
    'Malayalam songs',
    'Classical music',
    'Devotional songs',
    'Rock music',
    'Pop hits',
    'Electronic music',
    'Jazz music',
    'Indie music'
  ];
  
  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript);
    if (transcript.trim()) {
      addToRecentSearches(transcript.trim());
      onSearch(transcript.trim());
      setShowSuggestions(false);
    }
  };

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceSearch(handleVoiceResult);

  const addToRecentSearches = (searchQuery: string) => {
    const updatedSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updatedSearches);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToRecentSearches(query.trim());
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    addToRecentSearches(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
    
    // Get live suggestions from YouTube
    if (value.length >= 2) {
      setIsLoadingSuggestions(true);
      youtubeApi.debouncedGetSuggestions(value, (suggestions) => {
        setLiveSuggestions(suggestions);
        setIsLoadingSuggestions(false);
      });
    } else {
      setLiveSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (query.length > 0 || recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Filter suggestions based on query
  const getFilteredSuggestions = () => {
    if (!query.trim()) {
      return {
        recent: recentSearches.slice(0, 5),
        popular: popularSuggestions.slice(0, 8),
        live: []
      };
    }
    
    const queryLower = query.toLowerCase();
    const filteredRecent = recentSearches.filter(search => 
      search.toLowerCase().includes(queryLower)
    ).slice(0, 3);
    
    const filteredPopular = popularSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(queryLower)
    ).slice(0, 5);
    
    return {
      recent: filteredRecent,
      popular: filteredPopular,
      live: liveSuggestions.slice(0, 6)
    };
  };

  const { recent, popular, live } = getFilteredSuggestions();

  return (
    <div className="mb-4 md:mb-6 relative">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 md:space-x-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={isListening ? transcript : query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
      
      {/* Search Suggestions */}
      {showSuggestions && (recent.length > 0 || popular.length > 0 || live.length > 0 || isLoadingSuggestions) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2B2D42] border border-white/10 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* Live Suggestions */}
          {(live.length > 0 || isLoadingSuggestions) && query.length >= 2 && (
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Music className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">
                  {isLoadingSuggestions ? 'Searching...' : 'Suggestions'}
                </span>
                {isLoadingSuggestions && (
                  <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                )}
              </div>
              <div className="space-y-1">
                {isLoadingSuggestions ? (
                  // Loading skeleton
                  [...Array(3)].map((_, index) => (
                    <div key={`loading-${index}`} className="px-3 py-2 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    </div>
                  ))
                ) : (
                  live.map((suggestion, index) => (
                    <button
                      key={`live-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center space-x-2"
                    >
                      <Search className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{search}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          
          {recent.length > 0 && (
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recent.map((search, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {popular.length > 0 && (
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">
                  {query.trim() ? 'Matching Suggestions' : 'Popular Searches'}
                </span>
              </div>
              <div className="space-y-1">
                {popular.map((suggestion, index) => (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center space-x-2"
                  >
                    <TrendingUp className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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