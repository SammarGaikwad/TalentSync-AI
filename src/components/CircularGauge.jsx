import React, { useEffect, useState } from 'react';

export default function CircularGauge({ score, max = 10, label, gradientStart = '#8b5cf6', gradientEnd = '#ec4899', glowClass = 'glow-violet' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    // Reset to 0 first, then trigger animation for transitions between candidates
    setAnimatedScore(0);
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeDashoffset = circumference - (animatedScore / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl glass-panel-interactive transition-all duration-300">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Glowing Background Blur */}
        <div className={`absolute inset-4 rounded-full filter blur-xl opacity-20 transition-all duration-500 ${glowClass}`} style={{ backgroundColor: gradientStart }} />
        
        {/* SVG Gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-gray-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={`url(#gradient-${label.replace(/\s+/g, '-')})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </svg>
        
        {/* Inner Score Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {score}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            of {max}
          </span>
        </div>
      </div>
      
      {/* Label */}
      <h3 className="mt-3 text-sm font-medium tracking-wide text-gray-300 uppercase">
        {label}
      </h3>
    </div>
  );
}
