import React, { useRef, useState, useEffect } from 'react';
import { prefersReducedMotion } from '../../utils/motion.js';
import { ensureCustomFont } from '../../utils/loadCardFont.js';

export default function CardFace({
  card,
  cardNumber = '9000 1234 5678 9012',
  isFocused = true,
  animationSetting = 'mid', // 'off' | 'low' | 'mid' | 'high' | 'max'
  glassMode = 'auto',
  className = '',
  onClick
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [videoTier, setVideoTier] = useState(animationSetting);
  const [videoError, setVideoError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Sync setting
  useEffect(() => {
    setVideoTier(animationSetting);
    setVideoError(false);
  }, [animationSetting]);

  // Load custom font if needed
  useEffect(() => {
    if (card?.fontFamily && card?.fontFile) {
      ensureCustomFont(card.fontFamily.split(',')[0].replace(/['"]/g, ''), card.fontFile);
    }
  }, [card]);

  // Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      } else if (!document.hidden && isFocused && isVisible && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFocused, isVisible]);

  // IntersectionObserver to pause off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const shouldPlayVideo =
    isFocused &&
    isVisible &&
    !videoError &&
    videoTier !== 'off' &&
    !prefersReducedMotion() &&
    glassMode !== 'lite' &&
    Boolean(card?.videos || card?.video);

  // Play / pause control
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (shouldPlayVideo) {
      el.play().catch(() => {
        // Autoplay policy prevented playback
      });
    } else {
      el.pause();
    }
  }, [shouldPlayVideo]);

  // Pick video source URL based on tier
  const getVideoSrc = () => {
    if (!card) return null;
    if (card.videos) {
      const order = ['max', 'high', 'mid', 'low'];
      const targetIndex = order.indexOf(videoTier);
      const validTiers = targetIndex !== -1 ? order.slice(targetIndex) : ['mid', 'low'];
      for (const t of validTiers) {
        if (card.videos[t]) return card.videos[t];
      }
      return card.videos.mid || card.videos.low || card.videos.high || card.videos.max;
    }
    return card.video || null;
  };

  const handleVideoError = () => {
    // Try lower tier or fall back to poster
    if (videoTier === 'max') setVideoTier('high');
    else if (videoTier === 'high') setVideoTier('mid');
    else if (videoTier === 'mid') setVideoTier('low');
    else setVideoError(true);
  };

  const videoSrc = shouldPlayVideo ? getVideoSrc() : null;
  const posterSrc = card?.poster || card?.image;

  // Mask card number: "9000 •••• •••• 9012"
  const formattedNumber = cardNumber ? cardNumber.replace(/\s+/g, '') : '9000123456789012';
  const prefix = formattedNumber.slice(0, 4);
  const suffix = formattedNumber.slice(-4);
  const maskedDisplay = revealed
    ? `${prefix} ${formattedNumber.slice(4, 8)} ${formattedNumber.slice(8, 12)} ${suffix}`
    : `${prefix} •••• •••• ${suffix}`;

  const textColor = card?.textColor || '#FFFFFF';
  const textShadow = card?.textShadow || '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)';
  const fontFamily = card?.fontFamily || 'inherit';
  const numberFont = card?.numberFont || fontFamily;
  const letterSpacing = card?.letterSpacing || '0.05em';
  const objectPosition = card?.objectPosition || 'center center';

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        aspectRatio: '1.586 / 1',
        fontFamily
      }}
      className={`relative w-full rounded-2xl overflow-hidden shadow-xl select-none transition-transform duration-200 border border-white/20 bg-neutral-900 ${className}`}
    >
      {/* Background Poster Image */}
      {posterSrc && (
        <img
          src={posterSrc}
          alt={card?.name || 'NovaBank Card'}
          loading="lazy"
          style={{ objectPosition }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            shouldPlayVideo && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Background Animated Video */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          loop
          preload="metadata"
          onError={handleVideoError}
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Card Foreground Details - NovaBank & Card Number ONLY */}
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between pointer-events-none z-10">
        {/* Top: NovaBank Brand */}
        <div className="flex items-center justify-between">
          <span
            style={{
              color: textColor,
              textShadow,
              letterSpacing
            }}
            className="text-lg sm:text-xl font-bold tracking-wider"
          >
            NovaBank
          </span>
          <span
            style={{
              color: textColor,
              textShadow
            }}
            className="text-xs uppercase tracking-widest opacity-80"
          >
            Virtual
          </span>
        </div>

        {/* Bottom: Masked Card Number with tap-to-reveal toggle */}
        <div className="flex items-end justify-between">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(prev => !prev);
            }}
            style={{
              color: textColor,
              textShadow,
              fontFamily: numberFont,
              fontVariantNumeric: 'tabular-nums'
            }}
            title="Click to reveal / hide card number"
            className="pointer-events-auto cursor-pointer group flex items-center gap-2"
          >
            <span className="text-sm sm:text-base tracking-[0.2em] font-semibold">
              {maskedDisplay}
            </span>
            <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
              {revealed ? 'hide' : 'show'}
            </span>
          </div>

          <div
            style={{
              color: textColor,
              textShadow
            }}
            className="text-right text-[10px] sm:text-xs opacity-90 font-medium tracking-wide"
          >
            <span>{card?.name || 'Exclusive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
