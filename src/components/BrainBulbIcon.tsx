import React from 'react';

interface BrainBulbIconProps {
  className?: string;
  size?: number;
}

export const BrainBulbIcon: React.FC<BrainBulbIconProps> = ({
  className = 'w-6 h-6',
  size,
}) => {
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...sizeProps}
    >
      {/* Left hemisphere brain-bulb lobes */}
      <path d="M9.5 2C7.5 2 5.5 3.2 5 5.5C4.6 6.9 5 8.2 5.8 9.2C5 10.3 5.2 12 6.2 13C7.1 13.9 8.2 14.5 9.5 15" />
      <path d="M6.2 7.2C7 7.5 8 7 8.5 6.2" />
      <path d="M6.5 10.5C7.3 10.5 8 11.2 8.5 12" />

      {/* Right hemisphere brain-bulb lobes */}
      <path d="M14.5 2C16.5 2 18.5 3.2 19 5.5C19.4 6.9 19 8.2 18.2 9.2C19 10.3 18.8 12 17.8 13C16.9 13.9 15.8 14.5 14.5 15" />
      <path d="M17.8 7.2C17 7.5 16 7 15.5 6.2" />
      <path d="M17.5 10.5C16.7 10.5 16 11.2 15.5 12" />

      {/* Central neural fissure / bulb filament stem */}
      <path d="M12 3V15" strokeDasharray="1 1.5" />
      <path d="M10 6C11 6.5 13 6.5 14 6" />
      <path d="M10 10C11 9.5 13 9.5 14 10" />

      {/* Screw base threads (threaded socket) */}
      <path d="M9 16.5H15" />
      <path d="M9.5 18.5H14.5" />
      <path d="M10.5 20.5H13.5" />
      {/* Bottom contact terminal */}
      <path d="M11 22H13" />
    </svg>
  );
};
