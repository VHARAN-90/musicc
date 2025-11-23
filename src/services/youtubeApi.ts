import { YouTubeVideo, YouTubeSearchResponse, YouTubeVideoDetailsResponse } from '../types/youtube';

const API_KEY = 'AIzaSyAxt_2GoNXOu_hpW9bpWnp7V9BKWEtYLQY';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const extractMusicDirector = (title: string, channelTitle: string): string => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  
  const patterns = [
    /(?:sung by|singer|vocals?)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:by|artist)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:ft\.?|feat\.?|featuring)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:music director|music)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:composed by|composer)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:lyrics|lyricist)[:\s]+([^|,\-\(\)\[\]]+)/i,
    /(?:voice|voice of)[:\s]+([^|,\-\(\)\[\]]+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanTitle.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim()
        .replace(/official.*$/i, '')
        .replace(/video.*$/i, '')
        .replace(/song.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (extracted.length > 1) {
        return extracted;
      }
    }
  }

  const separators = [' - ', ' | ', ' : ', ' by '];
  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      const parts = cleanTitle.split(separator);
      if (parts.length >= 2) {
        const firstPart = parts[0].trim()
          .replace(/official.*$/i, '')
          .replace(/video.*$/i, '')
          .replace(/song.*$/i, '')
          .trim();
        
        if (firstPart && 
            !firstPart.toLowerCase().includes('official') && 
            !firstPart.toLowerCase().includes('video') &&
            !firstPart.toLowerCase().includes('lyrical') &&
            firstPart.length > 2 && 
            firstPart.length < 50) {
          return firstPart;
        }
        
        const secondPart = parts[1].trim()
          .replace(/official.*$/i, '')
          .replace(/video.*$/i, '')
          .replace(/song.*$/i, '')
          .trim();
        
        if (secondPart && 
            !secondPart.toLowerCase().includes('official') && 
            !secondPart.toLowerCase().includes('video') &&
            !secondPart.toLowerCase().includes('lyrical') &&
            secondPart.length > 2 && 
            secondPart.length < 50) {
          return secondPart;
        }
      }
    }
  }

  const channelLower = channelTitle.toLowerCase();
  const excludeWords = [
    'records', 'music', 'entertainment', 'official', 'label', 'productions',
    'studios', 'films', 'movies', 'channel', 'tv', 'media', 'digital',
    'bollywood', 'hollywood', 'south', 'tamil', 'telugu', 'hindi', 'punjabi',
    'bhojpuri', 'gujarati', 'marathi', 'bengali', 'malayalam', 'kannada',
    'company', 'corp', 'ltd', 'inc', 'pvt', 'limited'
  ];
  
  const hasExcludedWords = excludeWords.some(word => channelLower.includes(word));
  
  if (!hasExcludedWords && 
      channelTitle.length > 2 && 
      channelTitle.length < 30 &&
      !channelTitle.includes('&') &&
      !channelTitle.includes('|')) {
    return channelTitle;
  }

  const namePattern = /([A-Z][a-z]+ [A-Z][a-z]+)/;
  const nameMatch = cleanTitle.match(namePattern);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim();
    if (name.length > 5 && name.length < 30) {
      return name;
    }
  }

  return "Unknown Artist";
};

export class YouTubeApiService {
  private apiKey: string;
  private suggestionCache: Map<string, string[]> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(apiKey: string = API_KEY) {
    this.apiKey = apiKey;
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) return [];
    
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    try {
      // Use YouTube's autocomplete API
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&callback=?`,
        {
          method: 'GET',
          mode: 'cors',
        }
      );
      
      if (!response.ok) {
        // Fallback to search API for suggestions
        return this.getFallbackSuggestions(query);
      }

      const text = await response.text();
      // Parse JSONP response
      const jsonMatch = text.match(/\[.*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const suggestions = data[1]?.map((item: any) => item[0]) || [];
        
        // Cache the results
        this.suggestionCache.set(cacheKey, suggestions.slice(0, 8));
        return suggestions.slice(0, 8);
      }
      
      return this.getFallbackSuggestions(query);
    } catch (error) {
      console.log('Suggestion API failed, using fallback');
      return this.getFallbackSuggestions(query);
    }
  }

  private async getFallbackSuggestions(query: string): Promise<string[]> {
    try {
      // Use YouTube search API to get related suggestions
      const searchUrl = `${BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(query + ' music')}&maxResults=5&key=${this.apiKey}&videoCategoryId=10`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.items) {
        const suggestions = data.items.map((item: any) => {
          // Extract clean suggestions from video titles
          let title = item.snippet.title;
          // Remove common suffixes
          title = title.replace(/\s*\(.*?\)\s*/g, '');
          title = title.replace(/\s*\[.*?\]\s*/g, '');
          title = title.replace(/\s*(official|video|song|music|lyrical|full)\s*/gi, '');
          return title.trim();
        }).filter((title: string) => title.length > 0);
        
        return [...new Set(suggestions)].slice(0, 5); // Remove duplicates
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  debouncedGetSuggestions(query: string, callback: (suggestions: string[]) => void, delay: number = 300) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      const suggestions = await this.getSearchSuggestions(query);
      callback(suggestions);
    }, delay);
  }
  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      const musicQuery = `${query} +song`;
      const searchUrl = `${BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(musicQuery)}&maxResults=${maxResults}&key=${this.apiKey}&videoCategoryId=10`;
      const searchResponse = await fetch(searchUrl);
      const searchData: YouTubeSearchResponse = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      const videoIds = searchData.items.map(item => item.id.videoId).join(',');
      const detailsUrl = `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoIds}&key=${this.apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();

      return detailsData.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: extractMusicDirector(item.snippet.title, item.snippet.channelTitle),
        thumbnails: item.snippet.thumbnails,
        duration: item.contentDetails.duration,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description
      }));
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const youtubeApi = new YouTubeApiService();