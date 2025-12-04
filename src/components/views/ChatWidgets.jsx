import React from 'react';
import { Dumbbell, Plus, TrendingUp, Calendar, Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

/**
 * Widget to display a suggested workout plan
 */
export function WorkoutPlanWidget({ data, onSave, onStart }) {
  const { name, duration, difficulty, exercises, reason } = data;

  return (
    <Card hover={false} className="w-full max-w-sm bg-gray-800 border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-white text-lg">{name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
            {difficulty}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {duration} min
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" /> {exercises.length} exercises
          </span>
        </div>
        {reason && (
          <p className="text-xs text-gray-500 mt-2 italic">"{reason}"</p>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        {exercises.slice(0, 3).map((ex, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-300">{ex.name}</span>
            <span className="text-gray-500">{ex.sets} x {ex.reps}</span>
          </div>
        ))}
        {exercises.length > 3 && (
          <p className="text-xs text-center text-gray-500 pt-1">
            + {exercises.length - 3} more exercises
          </p>
        )}
      </div>

      <div className="p-3 bg-gray-900/50 border-t border-gray-700 flex gap-2">
        <Button 
          size="sm" 
          variant="secondary"
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          onClick={() => onSave(data)}
          icon={Plus}
        >
          Save
        </Button>
        <Button 
          size="sm" 
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          onClick={() => onStart && onStart(data)}
          icon={Play}
        >
          Start Now
        </Button>
      </div>
    </Card>
  );
}

/**
 * Widget to display stats summary
 */
export function StatsWidget({ data }) {
  const { title, metrics } = data;

  return (
    <Card hover={false} className="w-full max-w-sm bg-gray-800 border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-gray-900/50 p-3 rounded-lg text-center">
            <p className="text-xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
