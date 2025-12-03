import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

/**
 * Calendar Component for History View
 * Task 4: Calendar View for History
 */
export function Calendar({ 
  selectedDate, 
  onSelectDate, 
  markedDates = [], 
  minDate = null,
  maxDate = null 
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const markedDatesSet = useMemo(() => {
    return new Set(markedDates.map(d => {
      const date = d instanceof Date ? d : new Date(d);
      return date.toISOString().split('T')[0];
    }));
  }, [markedDates]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before the first day of the month
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today.toISOString().split('T')[0]);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  const hasWorkout = (date) => {
    if (!date) return false;
    return markedDatesSet.has(date.toISOString().split('T')[0]);
  };

  const isDisabled = (date) => {
    if (!date) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    if (minDate && date < new Date(minDate)) return true;
    return false;
  };

  const handleDateClick = (date) => {
    if (!date || isDisabled(date)) return;
    onSelectDate(date.toISOString().split('T')[0]);
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-200">{monthName}</h3>
          <button
            onClick={goToToday}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 bg-emerald-500/10 rounded-lg"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(date)}
            disabled={isDisabled(date)}
            className={`
              relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
              ${!date ? 'invisible' : ''}
              ${isDisabled(date) ? 'text-gray-700 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'}
              ${isSelected(date) ? 'bg-emerald-500 text-gray-950 font-bold' : ''}
              ${isToday(date) && !isSelected(date) ? 'bg-gray-800 text-emerald-400 font-bold' : ''}
              ${!isSelected(date) && !isToday(date) ? 'text-gray-300' : ''}
            `}
          >
            {date?.getDate()}
            {/* Workout indicator dot */}
            {hasWorkout(date) && !isSelected(date) && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs text-gray-500">Has workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-gray-800 rounded text-xs text-emerald-400 font-bold flex items-center justify-center">T</span>
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
