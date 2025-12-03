import { useState } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Modal';
import { ViewHeader } from '../layout/Navigation';

/**
 * HistoryView - Workout history with expandable session details
 */
export function HistoryView({ workouts, onBack, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    return `${Math.floor(seconds / 60)} min`;
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ViewHeader 
        title="Workout History" 
        subtitle={`${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`}
      />

      <div className="p-6 space-y-3">
        {workouts.length === 0 && (
          <Card hover={false} className="p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-400 mb-2">No workouts yet</h3>
            <p className="text-sm text-gray-600 mb-4">Start your first workout to see your history here</p>
            <Button onClick={onBack} size="sm">Start Workout</Button>
          </Card>
        )}

        {workouts.map((session, index) => {
          const isExpanded = expandedId === session.id;
          const date = session.timestamp;

          return (
            <Card 
              key={session.id} 
              hover={false} 
              className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-200 tracking-tight">{session.workoutName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {session.duration && (
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                          {formatDuration(session.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {session.exercises?.length || 0} exercises
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-4">
                    {session.exercises?.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 font-medium">{ex.name}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {ex.sets?.map((s, si) => (
                            <span key={si} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                              {s.weight}kg×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {session.note && (
                    <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                      <p className="text-xs text-gray-500 italic">"{session.note}"</p>
                    </div>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session.id);
                    }}
                  >
                    Delete Session
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Workout?"
        message="This action cannot be undone. Your workout data will be permanently removed."
        onConfirm={() => {
          onDelete(deleteConfirm);
          setDeleteConfirm(null);
          setExpandedId(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

export default HistoryView;
