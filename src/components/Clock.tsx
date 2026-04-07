import React, { useState, useEffect } from 'react';
import { Calendar, Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 py-1.5 md:py-2 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-1.5 md:gap-2 text-[#1877F2]">
        <ClockIcon size={14} className="animate-pulse md:w-4 md:h-4" />
        <span className="text-[11px] md:text-sm font-black tabular-nums tracking-tight">
          {formatTime(time)}
        </span>
      </div>
      <div className="hidden sm:block h-4 w-[1px] bg-gray-200" />
      <div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-gray-500">
        <Calendar size={14} className="md:w-4 md:h-4" />
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
          {formatDate(time)}
        </span>
      </div>
    </div>
  );
}
