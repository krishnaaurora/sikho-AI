import React from 'react';
import { CourseLevel } from '../../types';

interface DifficultyBadgeProps {
  level: CourseLevel;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level }) => {
  const configs = {
    [CourseLevel.BEGINNER]: { 
      label: 'Beginner', 
      className: 'bg-primary/10 text-primary' 
    },
    [CourseLevel.INTERMEDIATE]: { 
      label: 'Intermediate', 
      className: 'bg-amber-100 dark:bg-amber-900/20 text-amber-850 dark:text-amber-400' 
    },
    [CourseLevel.ADVANCED]: { 
      label: 'Advanced', 
      className: 'bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400' 
    },
  };

  const config = configs[level];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default DifficultyBadge;
