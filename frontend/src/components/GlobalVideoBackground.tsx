'use client';

import React, { useEffect, useState, useRef } from 'react';

export const GlobalVideoBackground: React.FC = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (videoRef.current && !reduceMotion) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted by browser until user interaction
      });
    }
  }, [reduceMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden pointer-events-none select-none bg-[#0A0F1D]"
    >
      {/* 1. Underlying animated flow motion video */}
      {!reduceMotion && (
        <video
          ref={videoRef}
          src="/videos/flow-background.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 2. Professional Navy/Slate Atmospheric Overlays */}
      {/* Layer A: Base subtle dark overlay that preserves motion while assuring text legibility */}
      <div className="absolute inset-0 bg-[#0A0F1D]/50 pointer-events-none" />

      {/* Layer B: Vertical gradient for navbar and footer edge depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/75 via-transparent to-[#0A0F1D]/80 pointer-events-none" />

      {/* Layer C: Subtle radial vignette for central content focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,15,29,0.4)_65%,rgba(10,15,29,0.85)_100%)] pointer-events-none" />

      {/* Layer D: Brand ambient lighting (Cyan & Purple glows) */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -top-20 right-1/4 w-[500px] h-[350px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />
    </div>
  );
};

export default GlobalVideoBackground;
