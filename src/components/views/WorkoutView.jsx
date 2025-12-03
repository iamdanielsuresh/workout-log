import { ArrowLeft, Timer, Save, StickyNote } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { RestTimer } from '../workout/RestTimer';
import { ProgressBar } from '../workout/ProgressBar';
import { ExerciseLogger } from '../workout/ExerciseLogger';

/**
 * WorkoutView - Active workout session with exercise logging
 */
export function WorkoutView({
  plan, activeLog, history, workoutNote, formatTime,
  aiEnabled, aiTips, aiTipLoading, isSaving,
  onBack, onFinish, onUpdateLog, onUpdateNote, onRequestTip
}) {
  const completedCount = Object.keys(activeLog).filter(name => {
    const log = activeLog[name];
    return log?.sets?.some(s => s.weight && s.reps);
  }).length;

  return (
    <div className="pb-40 max-w-lg mx-auto min-h-screen safe-area-top">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/90 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-100 tracking-tight">{plan.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <Timer className="w-3 h-3" />
                  {formatTime()}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-xl font-display font-bold text-emerald-400">
              {completedCount}/{plan.exercises.length}
            </p>
          </div>
        </div>
        <ProgressBar completed={completedCount} total={plan.exercises.length} />
      </div>

      <div className="p-6 space-y-6">
        <RestTimer />

        {plan.exercises.map((ex, idx) => (
          <ExerciseLogger
            key={idx}
            exercise={ex}
            lastLog={history[ex.name]}
            onUpdate={(sets) => onUpdateLog(ex.name, sets)}
            aiTip={aiTips[ex.name]}
            onRequestTip={aiEnabled ? () => onRequestTip(ex.name) : null}
            aiLoading={aiTipLoading[ex.name]}
            isCompleted={activeLog[ex.name]?.sets?.some(s => s.weight && s.reps)}
          />
        ))}

        {/* Notes */}
        <Card hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold">
            <StickyNote className="w-4 h-4" />
            <h3>Session Notes</h3>
          </div>
          <Textarea
            value={workoutNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            placeholder="How did it feel? Any pain? Good pump?"
            className="h-24"
          />
        </Card>
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-50 safe-area-bottom">
        <Button
          onClick={onFinish}
          disabled={isSaving}
          loading={isSaving}
          size="xl"
          className="w-full"
          icon={Save}
        >
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

export default WorkoutView;
