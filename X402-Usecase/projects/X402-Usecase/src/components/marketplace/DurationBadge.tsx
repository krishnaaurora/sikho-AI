import React from 'react';

interface DurationBadgeProps {
  duration?: number; // in minutes
}

const DurationBadge: React.FC<DurationBadgeProps> = ({ duration }) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!duration) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeWidth="2" d="M12 6v6l4 2" />
      </svg>
      {formatDuration(duration)}
    </span>
  );
};

export default DurationBadge;
