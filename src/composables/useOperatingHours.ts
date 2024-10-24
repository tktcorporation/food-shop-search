import { useState, useEffect } from 'react';

export const useOperatingHours = (weekdayText?: string[]) => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!weekdayText) {
      setIsOpen(null);
      return;
    }

    const checkIsOpen = () => {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      const currentTime = now.getHours() * 100 + now.getMinutes();

      const todaySchedule = weekdayText.find(text => text.startsWith(currentDay));
      if (!todaySchedule) {
        setIsOpen(null);
        return;
      }

      const timeRanges = todaySchedule
        .replace(`${currentDay}: `, '')
        .split(', ')
        .map(range => {
          if (range.toLowerCase() === 'closed') return null;
          const [start, end] = range.split('–').map(time => {
            const [hours, minutes = '00'] = time.replace(/\s*(AM|PM)/i, '').split(':');
            let hour = parseInt(hours);
            if (time.toLowerCase().includes('pm') && hour !== 12) hour += 12;
            if (time.toLowerCase().includes('am') && hour === 12) hour = 0;
            return hour * 100 + parseInt(minutes);
          });
          return { start, end };
        })
        .filter(Boolean);

      const isCurrentlyOpen = timeRanges.some(range => {
        if (!range) return false;
        if (range.end < range.start) {
          return currentTime >= range.start || currentTime <= range.end;
        }
        return currentTime >= range.start && currentTime <= range.end;
      });

      setIsOpen(isCurrentlyOpen);
    };

    checkIsOpen();
    const interval = setInterval(checkIsOpen, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [weekdayText]);

  return { isOpen };
};