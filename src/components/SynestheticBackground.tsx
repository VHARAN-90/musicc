import React, { useEffect, useRef, useState } from 'react';
import { YouTubeVideo } from '../types/youtube';

interface SynestheticBackgroundProps {
  currentTrack: YouTubeVideo | null;
  isPlaying: boolean;
  audioData?: Uint8Array;
}

export const SynestheticBackground: React.FC<SynestheticBackgroundProps> = ({
  currentTrack,
  isPlaying,
  audioData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [colors, setColors] = useState({
    primary: '#FF3CAC',
    secondary: '#784BA0',
    accent: '#2B2D42',
  });

  // Extract colors from track metadata
  useEffect(() => {
    if (!currentTrack) return;

    const title = currentTrack.title.toLowerCase();
    const channel = currentTrack.channelTitle.toLowerCase();

    // Color mapping based on genre/mood
    const colorMappings = {
      // Energetic genres
      rock: { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#45B7D1' },
      electronic: { primary: '#00D4FF', secondary: '#FF0080', accent: '#8A2BE2' },
      pop: { primary: '#FF69B4', secondary: '#FFD700', accent: '#FF1493' },
      
      // Calm genres
      classical: { primary: '#E6E6FA', secondary: '#DDA0DD', accent: '#9370DB' },
      jazz: { primary: '#CD853F', secondary: '#D2691E', accent: '#8B4513' },
      ambient: { primary: '#87CEEB', secondary: '#B0E0E6', accent: '#4682B4' },
      
      // Cultural
      bollywood: { primary: '#FF6347', secondary: '#FFD700', accent: '#FF4500' },
      devotional: { primary: '#FFA500', secondary: '#FF8C00', accent: '#FF7F50' },
      
      // Default
      default: { primary: '#FF3CAC', secondary: '#784BA0', accent: '#2B2D42' },
    };

    let selectedColors = colorMappings.default;

    for (const [genre, colors] of Object.entries(colorMappings)) {
      if (genre !== 'default' && (title.includes(genre) || channel.includes(genre))) {
        selectedColors = colors;
        break;
      }
    }

    setColors(selectedColors);
  }, [currentTrack]);

  // Audio-reactive visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }> = [];

    const createParticle = (x: number, y: number, intensity: number) => {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * intensity * 2,
        vy: (Math.random() - 0.5) * intensity * 2,
        size: Math.random() * intensity * 3 + 1,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
        life: 1,
      });
    };

    const animate = () => {
      ctx.fillStyle = `${colors.accent}15`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.016;

      if (isPlaying && audioData) {
        // Analyze audio data
        const bassSum = audioData.slice(0, audioData.length / 4).reduce((sum, val) => sum + val, 0);
        const midSum = audioData.slice(audioData.length / 4, audioData.length / 2).reduce((sum, val) => sum + val, 0);
        const trebleSum = audioData.slice(audioData.length / 2).reduce((sum, val) => sum + val, 0);

        const bassIntensity = bassSum / (audioData.length / 4) / 255;
        const midIntensity = midSum / (audioData.length / 4) / 255;
        const trebleIntensity = trebleSum / (audioData.length / 2) / 255;

        // Create particles based on audio intensity
        if (Math.random() < bassIntensity * 0.3) {
          createParticle(
            Math.random() * canvas.width,
            canvas.height - Math.random() * 100,
            bassIntensity * 10
          );
        }

        if (Math.random() < trebleIntensity * 0.2) {
          createParticle(
            Math.random() * canvas.width,
            Math.random() * 100,
            trebleIntensity * 8
          );
        }

        // Draw frequency bars
        const barWidth = canvas.width / audioData.length;
        for (let i = 0; i < audioData.length; i += 4) {
          const barHeight = (audioData[i] / 255) * canvas.height * 0.3;
          const hue = (i / audioData.length) * 360;
          
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
        }

        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = colors.primary + '80';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < audioData.length; i++) {
          const x = (i / audioData.length) * canvas.width;
          const y = canvas.height / 2 + (audioData[i] - 128) * (canvas.height / 4) / 128;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      } else {
        // Ambient animation when not playing
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < 3; i++) {
          const radius = 100 + i * 50 + Math.sin(time + i) * 20;
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          
          gradient.addColorStop(0, colors.primary + '20');
          gradient.addColorStop(0.5, colors.secondary + '10');
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;
        particle.size *= 0.99;
        
        if (particle.life <= 0 || particle.size < 0.5) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioData, colors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: `linear-gradient(135deg, ${colors.accent}40, ${colors.primary}20, ${colors.secondary}20)`,
      }}
    />
  );
};