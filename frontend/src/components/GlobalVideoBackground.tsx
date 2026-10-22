'use client';

import React, { useEffect, useRef } from 'react';

export const GlobalVideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays and stays muted for browser autoplay policy
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        // Autoplay fallback if browser pauses before user interaction
      });
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden pointer-events-none select-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100dvh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {/* 1. Underlying animated flow motion video (original learnlens_flow_motion.mp4) */}
      <video
        ref={videoRef}
        src="/videos/flow-background.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* 2. Single subtle dark tint ONLY for text legibility, preserving the vibrant flow motion */}
      <div
        className="absolute inset-0 bg-[#0A0F1D]/35 pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(10, 15, 29, 0.35)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default GlobalVideoBackground;
