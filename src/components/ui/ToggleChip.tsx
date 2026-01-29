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
    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'} ${className}`}
  >
    {children}
  </button>
);

export default ToggleChip;
