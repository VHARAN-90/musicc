import React, { useRef, useEffect, useState } from 'react';
import { YouTubeVideo } from '../types/youtube';
import { getMoodColors } from '../utils/moodDetection';

interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  audioData?: Uint8Array;
  isPlaying: boolean;
  currentTrack?: YouTubeVideo | null;
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  currentTime,
  duration,
  onSeek,
  audioData,
  isPlaying,
  currentTrack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gestureStartX, setGestureStartX] = useState(0);
  const [gestureStartTime, setGestureStartTime] = useState(0);

  // Get mood-based colors
  const moodColors = getMoodColors(currentTrack);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    canvas.width = container.offsetWidth * 2; // High DPI
    canvas.height = 80 * 2;
    canvas.style.width = container.offsetWidth + 'px';
    canvas.style.height = '80px';

    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);

    if (audioData) {
      // Draw waveform
      const barWidth = (canvas.width / 2) / audioData.length;
      const centerY = canvas.height / 4;

      for (let i = 0; i < audioData.length; i++) {
        const barHeight = (audioData[i] / 255) * (canvas.height / 4);
        const x = i * barWidth;
        
        // Color based on playback position
        const progress = duration > 0 ? currentTime / duration : 0;
        const isPlayed = i < audioData.length * progress;
        
        ctx.fillStyle = isPlayed 
          ? moodColors.waveformPlayed
          : moodColors.waveform;
        
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      }
    } else {
      // Draw placeholder waveform
      const bars = 100;
      const barWidth = (canvas.width / 2) / bars;
      const centerY = canvas.height / 4;

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * 30 + 5;
        const x = i * barWidth;
        
        const progress = duration > 0 ? currentTime / duration : 0;
        const isPlayed = i < bars * progress;
        
        ctx.fillStyle = isPlayed 
          ? moodColors.waveformPlayed
          : moodColors.waveform;
        
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      }
    }

    // Draw playhead
    if (duration > 0) {
      const progress = currentTime / duration;
      const playheadX = progress * (canvas.width / 2);
      
      ctx.strokeStyle = moodColors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height / 2);
      ctx.stroke();
      
      // Playhead circle
      ctx.fillStyle = moodColors.primary;
      ctx.beginPath();
      ctx.arc(playheadX, canvas.height / 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [audioData, currentTime, duration, isHovering, moodColors]);

  const handleInteractionStart = (clientX: number) => {
    setIsDragging(true);
    setGestureStartX(clientX);
    setGestureStartTime(currentTime);
    handleSeek(clientX);
  };

  const handleInteractionMove = (clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - gestureStartX;
    const container = containerRef.current;
    if (!container) return;
    
    // Gesture-based tempo change (swipe fast to skip)
    const velocity = Math.abs(deltaX) / container.offsetWidth;
    if (velocity > 0.3) {
      // Fast swipe - skip by larger amounts
      const skipAmount = deltaX > 0 ? 30 : -30; // 30 seconds
      const newTime = Math.max(0, Math.min(duration, gestureStartTime + skipAmount));
      onSeek(newTime);
      setGestureStartTime(newTime);
      setGestureStartX(clientX);
    } else {
      // Normal scrubbing
      handleSeek(clientX);
    }
  };

  const handleSeek = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const seekTime = progress * duration;
    
    if (duration > 0) {
      onSeek(seekTime);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (duration <= 0) return;
    e.preventDefault();
    handleInteractionStart(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (duration <= 0) return;
    e.preventDefault();
    handleInteractionStart(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleInteractionMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleInteractionMove(e.touches[0].clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-20 cursor-pointer transition-all duration-200 ${
        isHovering || isDragging ? 'transform scale-105' : ''
      }`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
      />
      
      {/* Gesture hint */}
      {isHovering && !isDragging && (
        <div className="absolute top-2 left-2 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
          Swipe fast to skip • Drag to scrub
        </div>
      )}
      
      {/* Visual feedback during gesture */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF3CAC]/20 to-[#784BA0]/20 rounded-lg animate-pulse" />
      )}
    </div>
  );
};