import { YouTubeVideo } from '../types/youtube';

export interface MoodColors {
  primary: string;
  secondary: string;
  accent: string;
  waveform: string;
  waveformPlayed: string;
}

export type MoodType = 'energetic' | 'calm' | 'happy' | 'melancholic' | 'romantic' | 'aggressive' | 'spiritual' | 'festive' | 'nostalgic' | 'default';

export const MOOD_COLORS: Record<MoodType, MoodColors> = {
  energetic: {
    primary: '#FF0080',
    secondary: '#00D4FF',
    accent: '#8A2BE2',
    waveform: 'rgba(255, 0, 128, 0.3)',
    waveformPlayed: 'rgba(255, 0, 128, 0.8)',
  },
  calm: {
    primary: '#87CEEB',
    secondary: '#B0E0E6',
    accent: '#4682B4',
    waveform: 'rgba(135, 206, 235, 0.3)',
    waveformPlayed: 'rgba(135, 206, 235, 0.8)',
  },
  happy: {
    primary: '#FFD700',
    secondary: '#FF69B4',
    accent: '#FF1493',
    waveform: 'rgba(255, 215, 0, 0.3)',
    waveformPlayed: 'rgba(255, 215, 0, 0.8)',
  },
  melancholic: {
    primary: '#4169E1',
    secondary: '#6495ED',
    accent: '#191970',
    waveform: 'rgba(65, 105, 225, 0.3)',
    waveformPlayed: 'rgba(65, 105, 225, 0.8)',
  },
  romantic: {
    primary: '#FF69B4',
    secondary: '#FFB6C1',
    accent: '#DC143C',
    waveform: 'rgba(255, 105, 180, 0.3)',
    waveformPlayed: 'rgba(255, 105, 180, 0.8)',
  },
  aggressive: {
    primary: '#FF4500',
    secondary: '#FF6347',
    accent: '#8B0000',
    waveform: 'rgba(255, 69, 0, 0.3)',
    waveformPlayed: 'rgba(255, 69, 0, 0.8)',
  },
  spiritual: {
    primary: '#DDA0DD',
    secondary: '#E6E6FA',
    accent: '#9370DB',
    waveform: 'rgba(221, 160, 221, 0.3)',
    waveformPlayed: 'rgba(221, 160, 221, 0.8)',
  },
  festive: {
    primary: '#FF6347',
    secondary: '#FFD700',
    accent: '#FF4500',
    waveform: 'rgba(255, 99, 71, 0.3)',
    waveformPlayed: 'rgba(255, 99, 71, 0.8)',
  },
  nostalgic: {
    primary: '#CD853F',
    secondary: '#D2691E',
    accent: '#8B4513',
    waveform: 'rgba(205, 133, 63, 0.3)',
    waveformPlayed: 'rgba(205, 133, 63, 0.8)',
  },
  default: {
    primary: '#FF3CAC',
    secondary: '#784BA0',
    accent: '#2B2D42',
    waveform: 'rgba(255, 60, 172, 0.3)',
    waveformPlayed: 'rgba(255, 60, 172, 0.8)',
  },
};

export const detectMoodFromTrack = (track: YouTubeVideo): MoodType => {
  const title = track.title.toLowerCase();
  const channel = track.channelTitle.toLowerCase();
  const combined = `${title} ${channel}`;

  // Energetic/Electronic/Dance
  if (
    /\b(edm|electronic|dance|techno|house|dubstep|trance|remix|bass|drop|beat|party|club|rave)\b/.test(combined) ||
    /\b(energy|power|pump|hype|fire|lit|bangers?)\b/.test(combined)
  ) {
    return 'energetic';
  }

  // Calm/Relaxing
  if (
    /\b(calm|relax|chill|peaceful|meditation|ambient|soft|gentle|soothing|sleep|study)\b/.test(combined) ||
    /\b(piano|acoustic|instrumental|classical|nature|rain|ocean)\b/.test(combined)
  ) {
    return 'calm';
  }

  // Happy/Upbeat
  if (
    /\b(happy|joy|celebration|upbeat|cheerful|bright|sunny|smile|laugh|fun|good vibes)\b/.test(combined) ||
    /\b(pop|uplifting|positive|feel good|good mood)\b/.test(combined)
  ) {
    return 'happy';
  }

  // Melancholic/Sad
  if (
    /\b(sad|melancholy|depression|lonely|heartbreak|tears|cry|sorrow|pain|loss|goodbye)\b/.test(combined) ||
    /\b(blues|minor|slow|emotional|deep|dark)\b/.test(combined)
  ) {
    return 'melancholic';
  }

  // Romantic/Love
  if (
    /\b(love|romantic|romance|heart|valentine|wedding|couple|kiss|together|forever)\b/.test(combined) ||
    /\b(ballad|serenade|intimate|tender|sweet)\b/.test(combined)
  ) {
    return 'romantic';
  }

  // Aggressive/Rock/Metal
  if (
    /\b(rock|metal|punk|hardcore|aggressive|angry|rage|fight|war|battle|heavy)\b/.test(combined) ||
    /\b(guitar|drums|scream|loud|intense|brutal)\b/.test(combined)
  ) {
    return 'aggressive';
  }

  // Spiritual/Devotional
  if (
    /\b(spiritual|devotional|bhajan|kirtan|prayer|god|divine|sacred|temple|church|meditation)\b/.test(combined) ||
    /\b(mantra|chant|religious|holy|blessed|peace|soul)\b/.test(combined)
  ) {
    return 'spiritual';
  }

  // Festive/Celebration
  if (
    /\b(festival|celebration|party|wedding|birthday|holiday|christmas|diwali|holi|new year)\b/.test(combined) ||
    /\b(festive|carnival|parade|dance|traditional|folk)\b/.test(combined)
  ) {
    return 'festive';
  }

  // Nostalgic/Retro
  if (
    /\b(nostalgic|retro|vintage|old|classic|memories|childhood|90s|80s|70s|golden)\b/.test(combined) ||
    /\b(throwback|remember|past|history|traditional)\b/.test(combined)
  ) {
    return 'nostalgic';
  }

  return 'default';
};

export const getMoodColors = (track: YouTubeVideo | null): MoodColors => {
  if (!track) return MOOD_COLORS.default;
  
  const mood = detectMoodFromTrack(track);
  return MOOD_COLORS[mood];
};