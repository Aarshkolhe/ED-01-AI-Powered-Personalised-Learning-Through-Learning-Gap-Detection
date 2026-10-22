'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface ThinkFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: string;
  showText?: boolean;
  withLink?: boolean;
  priority?: boolean;
}

export const ThinkFlowLogo: React.FC<ThinkFlowLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  withLink = false,
  priority = false,
}) => {
  // Sizing configurations preserving exact display height and aspect ratio (1024:827)
  const config = {
    sm: { height: 'h-9 sm:h-10', imgW: 50, imgH: 40, text: 'text-base', subText: 'text-[9px]' },
    md: { height: 'h-10 sm:h-12', imgW: 60, imgH: 48, text: 'text-lg sm:text-xl', subText: 'text-[10px]' },
    lg: { height: 'h-16 sm:h-20', imgW: 99, imgH: 80, text: 'text-2xl', subText: 'text-xs' },
    xl: { height: 'h-24 sm:h-32', imgW: 159, imgH: 128, text: 'text-3xl', subText: 'text-sm' },
  }[size] || { height: 'h-10 sm:h-12', imgW: 60, imgH: 48, text: 'text-lg sm:text-xl', subText: 'text-[10px]' };

  const logoContent = (
    <div className={`inline-flex items-center space-x-2.5 sm:space-x-3 ${className}`}>
      {/* Transparent container preserving the logo's transparent background */}
      <div
        className={`${config.height} aspect-[1024/827] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.02]`}
      >
        <Image
          src="/thinkflow-logo-transparent.png"
          alt="ThinkFlow — Smarter Learning, Deeper Understanding"
          width={config.imgW}
          height={config.imgH}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${config.text} font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors leading-tight`}>
            ThinkFlow
          </span>
          <span className={`${config.subText} text-slate-400 font-medium leading-none hidden sm:block mt-0.5`}>
            Smarter Learning. Deeper Understanding.
          </span>
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link
        href="/"
        className="inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 group"
        title="ThinkFlow — Smarter Learning, Deeper Understanding"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default ThinkFlowLogo;
