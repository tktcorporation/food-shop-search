import { useState, useEffect } from 'react';
import { calculateOperatingHours } from '../utils/operatingHours';

interface OpeningHours {
  weekday_text?: string[];
}

export const useOperatingHours = (openingHours?: OpeningHours) => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!openingHours?.weekday_text) {
      setIsOpen(null);
      return;
    }

    const updateIsOpen = () => {
      setIsOpen(calculateOperatingHours(openingHours.weekday_text));
    };

    updateIsOpen();
    const interval = setInterval(updateIsOpen, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [openingHours]);

  return { isOpen };
};
