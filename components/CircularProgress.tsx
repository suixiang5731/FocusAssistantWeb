import React from 'react';

interface CircularProgressProps {
  totalSeconds: number;
  currentSeconds: number;
  color?: string;
  duration?: number;
  isBreathing?: boolean;
  isFinished?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  totalSeconds,
  currentSeconds,
  color = "stroke-teal-600",
  duration = 1000,
  isBreathing = false,
  isFinished = false,
  children
}) => {
  const radius = 135;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 1.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const progress = totalSeconds > 0 ? Math.min(Math.max(currentSeconds / totalSeconds, 0), 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center p-3">
      {/* Automatic Breathing Rhythm Ambient Aura */}
      {isBreathing && (
        <div 
          className="absolute inset-2 rounded-full border border-teal-400/30 bg-teal-500/10 blur-md pointer-events-none animate-breath-ring"
        />
      )}

      {/* Completion Ripple Ring */}
      {isFinished && (
        <div className="absolute inset-1 rounded-full border-2 border-emerald-500/40 animate-ring-ripple pointer-events-none" />
      )}

      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transform filter drop-shadow-2xs transition-transform duration-700"
      >
        {/* Background Track */}
        <circle
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-stone-200/80"
        />
        {/* Progress Track */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ 
            strokeDashoffset,
            transitionDuration: `${duration}ms`,
            transitionProperty: 'stroke-dashoffset',
            transitionTimingFunction: 'linear'
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`${color} transition-colors duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-900 pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
};