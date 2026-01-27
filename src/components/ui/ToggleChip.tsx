import type React from 'react';

interface ToggleChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const ToggleChip: React.FC<ToggleChipProps> = ({
  selected,
  onClick,
  children,
  className = '',
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
      selected
        ? 'bg-primary-500 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    } ${className}`}
  >
    {children}
  </button>
);

export default ToggleChip;
