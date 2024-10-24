// 営業時間の計算ユーティリティ
export const calculateOperatingHours = (weekdayText?: string[]) => {
  if (!weekdayText) return false;

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const todaySchedule = weekdayText.find(text => text.startsWith(currentDay));
  if (!todaySchedule) return false;

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

  return timeRanges.some(range => {
    if (!range) return false;
    if (range.end < range.start) {
      // 深夜営業の場合（例：22:00-6:00）
      return currentTime >= range.start || currentTime <= range.end;
    }
    return currentTime >= range.start && currentTime <= range.end;
  });
};