import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // Target height in pixels
  showText?: boolean;
  textClassName?: string;
  useImage?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  textClassName = '',
  useImage = true
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {useImage ? (
        <img
          src="/nec-alumni-logo.png"
          alt="NEC Alumni Portal"
          style={{ height: `${size}px`, width: 'auto' }}
          className="object-contain shrink-0"
        />
      ) : (
        <img
          src="/nec-alumni-logo.png"
          alt="NEC Alumni Portal"
          style={{ height: `${size}px`, width: 'auto' }}
          className="object-contain shrink-0"
        />
      )}
      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <span className="text-base font-bold tracking-tight text-primary">
            NEC <span className="text-slate-800 font-extrabold">ALUMNI</span>
          </span>
          <p className="text-[10px] font-medium text-slate-500 tracking-wide">
            National Engineering College
          </p>
        </div>
      )}
    </div>
  );
};
