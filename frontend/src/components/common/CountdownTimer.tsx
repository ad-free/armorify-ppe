import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  onEnd?: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onEnd, className = '', variant = 'full' }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; min: number; sec: number } | null>(null);
  const onEndRef = React.useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const targetTime = new Date(targetDate).getTime();
      const currentTime = new Date().getTime();
      
      if (isNaN(targetTime)) return null;
      
      const difference = targetTime - currentTime;
      
      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        min: Math.floor((difference / 1000 / 60) % 60),
        sec: Math.floor((difference / 1000) % 60),
      };
    };

    const initial = calculateTimeLeft();
    if (!initial) {
      onEndRef.current?.();
      return;
    }

    setTimeLeft(initial);

    const timer = setInterval(() => {
      const next = calculateTimeLeft();
      if (!next) {
        clearInterval(timer);
        setTimeLeft(null);
        onEndRef.current?.();
      } else {
        setTimeLeft(next);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 font-black text-xs ${className}`}>
        {timeLeft.days > 0 && (
          <div className="flex items-center gap-1 mr-1">
            <span className="bg-destructive text-white px-1.5 py-1 rounded min-w-[22px] text-center">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-destructive uppercase font-bold text-[10px]">Ngày</span>
          </div>
        )}
        <span className="bg-destructive text-white px-1.5 py-1 rounded min-w-[22px] text-center">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-destructive animate-pulse">:</span>
        <span className="bg-destructive text-white px-1.5 py-1 rounded min-w-[22px] text-center">{String(timeLeft.min).padStart(2, '0')}</span>
        <span className="text-destructive animate-pulse">:</span>
        <span className="bg-destructive text-white px-1.5 py-1 rounded min-w-[22px] text-center">{String(timeLeft.sec).padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-4 ${className}`}>
      {[
        { label: 'Ngày', value: timeLeft.days },
        { label: 'Giờ', value: timeLeft.hours },
        { label: 'Phút', value: timeLeft.min },
        { label: 'Giây', value: timeLeft.sec },
      ].map((item, idx, arr) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center flex-1 min-w-[60px] sm:min-w-[70px]">
            <div className="w-full h-14 sm:h-16 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center text-xl sm:text-2xl font-black text-gray-900 tabular-nums">
              {String(item.value).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2.5">{item.label}</span>
          </div>
          {idx < arr.length - 1 && (
            <div className="text-gray-300 font-black text-xl mb-6">:</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
