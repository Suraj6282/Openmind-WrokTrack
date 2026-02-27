import React, { useState, useEffect } from 'react';
import { Coffee, Play, Square } from 'lucide-react';
import Button from '../common/Button';

const BreakTimer = ({ attendance, onBreakStart, onBreakEnd }) => {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTime, setBreakTime] = useState(0);

  useEffect(() => {
    if (attendance?.breaks) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      setIsOnBreak(lastBreak && !lastBreak.endTime);
    }
  }, [attendance]);

  useEffect(() => {
    let interval;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnBreak]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Coffee className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">Break Time</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total break today: {attendance?.totalBreakDuration || 0} minutes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isOnBreak ? (
            <>
              <div className="text-xl font-mono font-bold text-purple-600">
                {formatTime(breakTime)}
              </div>
              <Button
                onClick={onBreakEnd}
                icon={Square}
                variant="secondary"
              >
                End Break
              </Button>
            </>
          ) : (
            <Button
              onClick={onBreakStart}
              icon={Play}
              variant="primary"
            >
              Start Break
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreakTimer;