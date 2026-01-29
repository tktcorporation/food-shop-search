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
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
      selected
        ? 'bg-primary-500 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    } ${className}`}
  >
    {children}
  </button>
);

export default ToggleChip;
