import { useEffect, useRef, useState, useCallback } from 'react';
import { YouTubeVideo, PlayerState } from '../types/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const useYouTubePlayer = () => {
  const playerRef = useRef<any>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    currentTrack: null,
    queue: [],
    currentIndex: 0,
  });
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const playNext = useCallback(() => {
    setPlayerState(prev => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex < prev.queue.length) {
        const nextTrack = prev.queue[nextIndex];
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(nextTrack.id);
        }
        return {
          ...prev,
          currentIndex: nextIndex,
          currentTrack: nextTrack,
        };
      } else {
        return { ...prev, isPlaying: false };
      }
    });
  }, []);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [playNext]);

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
          playerRef.current.setVolume(50);
          console.log('YouTube player is ready');
        },
        onStateChange: handleStateChange,
        onError: (event) => {
          console.error('YouTube player error:', event.data);
          // Try to skip to next track on error
          setTimeout(() => {
            playNext();
          }, 1000);
        },
      },
    });
  };

  const handleStateChange = (event: any) => {
    const state = event.data;
    console.log('Player state changed:', state);
    
    if (state === window.YT.PlayerState.PLAYING) {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      startTimeUpdate();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      stopTimeUpdate();
    } else if (state === window.YT.PlayerState.ENDED) {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      stopTimeUpdate();
      setTimeout(() => {
        playNext();
      }, 500);
    } else if (state === window.YT.PlayerState.BUFFERING) {
      console.log('Video is buffering...');
    } else if (state === window.YT.PlayerState.CUED) {
      console.log('Video is cued, starting playback...');
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    }
  };

  const startTimeUpdate = () => {
    stopTimeUpdate();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && 
          typeof playerRef.current.getCurrentTime === 'function' && 
          typeof playerRef.current.getDuration === 'function' &&
          typeof playerRef.current.getPlayerState === 'function') {
        
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        setPlayerState(prev => ({
          ...prev,
          currentTime,
          duration,
        }));

        if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
          stopTimeUpdate();
        }
      }
    }, 1000);
  };

  const stopTimeUpdate = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  };

  const loadVideo = (videoId: string) => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(videoId);
      // Small delay to ensure video is loaded before playing
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }, 500);
    }
  };

  const play = () => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  };

  const setVolume = (volume: number) => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
      setPlayerState(prev => ({ ...prev, volume }));
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds);
    }
  };

  const setQueue = (queue: YouTubeVideo[], startIndex: number = 0) => {
    console.log('Setting queue:', queue.length, 'tracks, starting at index:', startIndex);
    setPlayerState(prev => ({
      ...prev,
      queue,
      currentIndex: startIndex,
      currentTrack: queue[startIndex] || null,
    }));

    if (queue[startIndex]) {
      console.log('Loading first track:', queue[startIndex].title);
      loadVideo(queue[startIndex].id);
    }
  };

  const playPrevious = () => {
    console.log('Playing previous track');
    setPlayerState(prev => {
      const prevIndex = prev.currentIndex - 1;
      if (prevIndex >= 0 && prev.queue[prevIndex]) {
        const prevTrack = prev.queue[prevIndex];
        console.log('Loading previous track:', prevTrack.title);
        loadVideo(prevTrack.id);
        return {
          ...prev,
          currentIndex: prevIndex,
          currentTrack: prevTrack,
        };
      }
      return prev;
    });
  };

  const playTrack = (index: number) => {
    console.log('Playing track at index:', index);
    setPlayerState(prev => {
      if (index >= 0 && index < prev.queue.length) {
        const track = prev.queue[index];
        console.log('Loading track:', track.title);
        loadVideo(track.id);
        return {
          ...prev,
          currentIndex: index,
          currentTrack: track,
        };
      }
      return prev;
    });
  };

  return {
    playerState,
    isPlayerReady,
    play,
    pause,
    setVolume,
    seekTo,
    setQueue,
    playNext,
    playPrevious,
    playTrack,
  };
};