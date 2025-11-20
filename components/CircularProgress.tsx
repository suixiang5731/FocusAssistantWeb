import React from 'react';

interface CircularProgressProps {
  totalSeconds: number;
  currentSeconds: number;
  color?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  totalSeconds,
  currentSeconds,
  color = "stroke-indigo-600",
  children
}) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const strokeDashoffset = circumference - (currentSeconds / totalSeconds) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transform transition-all duration-1000 ease-linear"
      >
        <circle
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`${color} transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-800">
        {children}
      </div>
    </div>
  );
};