import { useState } from 'react';
import { 
  Dumbbell, ChevronRight, Clock, Plus, Edit3, 
  Trash2, MoreVertical, Check, X, Sparkles, Target,
  ChevronDown, ChevronUp, Info, Lightbulb
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/Navigation';

/**
 * PlansView - Manage workout plans/routines
 * View, edit, reorder, and manage workout plans
 */
export function PlansView({ 
  plans, 
  onSelectPlan, 
  onEditPlan,
  onDeletePlan,
  onCreatePlan
}) {
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const plansList = Object.values(plans || {});

  // Calculate unique exercises across all plans
  const uniqueExercises = new Set();
  plansList.forEach(plan => {
    plan.exercises?.forEach(ex => {
      if (ex.name) {
        uniqueExercises.add(ex.name.toLowerCase().trim());
      }
    });
  });

  // Count AI-generated plans
  const aiPlanCount = plansList.filter(p => p.source === 'ai-generated').length;

  return (
    <div className="min-h-screen pb-24">
      <ViewHeader 
        title="Workout Plans" 
        subtitle={`${plansList.length} routine${plansList.length !== 1 ? 's' : ''}`}
      />

      <div className="p-6 max-w-lg mx-auto space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-2xl font-bold text-emerald-400">{plansList.length}</p>
            <p className="text-xs text-gray-500">Routines</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-2xl font-bold text-blue-400">
              {uniqueExercises.size}
            </p>
            <p className="text-xs text-gray-500">Unique Exercises</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-2xl font-bold text-amber-400">
              {aiPlanCount}
            </p>
            <p className="text-xs text-gray-500">AI Plans</p>
          </div>
        </div>

        {/* Plans List */}
        <div className="space-y-3">
          {plansList.length === 0 ? (
            <Card hover={false} className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-400 mb-2">No workout plans</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your first workout routine to get started
              </p>
              <Button onClick={onCreatePlan} icon={Plus}>
                Create Plan
              </Button>
            </Card>
          ) : (
            plansList.map((plan) => {
              const isExpanded = expandedPlan === plan.id;
              const isAiGenerated = plan.source === 'ai-generated';

              return (
                <Card 
                  key={plan.id} 
                  hover={false} 
                  className="overflow-hidden"
                >
                  {/* Plan header */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        isAiGenerated 
                          ? 'bg-purple-500/20' 
                          : 'bg-emerald-500/20'
                      }`}>
                        {isAiGenerated ? (
                          <Sparkles className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Dumbbell className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-100 truncate">
                            {plan.name}
                          </h3>
                          {isAiGenerated && (
                            <span className="text-2xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {plan.exercises?.length || 0} exercises
                          </span>
                          {plan.estTime && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {plan.estTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
                      {/* Day tip for AI-generated plans */}
                      {plan.dayTip && (
                        <div className="flex items-start gap-2 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 mb-4">
                          <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-purple-300">{plan.dayTip}</p>
                        </div>
                      )}

                      {/* Description */}
                      {plan.desc && (
                        <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                      )}

                      {/* Exercises list with tips */}
                      <div className="space-y-2 mb-4">
                        {plan.exercises?.slice(0, 8).map((ex, i) => (
                          <ExercisePreviewCard key={i} exercise={ex} isAiGenerated={isAiGenerated} />
                        ))}
                        {(plan.exercises?.length || 0) > 8 && (
                          <p className="text-xs text-gray-600 text-center py-2">
                            +{plan.exercises.length - 8} more exercises
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onSelectPlan(plan.id)}
                          className="flex-1"
                          icon={Dumbbell}
                        >
                          Start Workout
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onEditPlan?.(plan.id)}
                          icon={Edit3}
                          className="px-4"
                        />
                        {deleteConfirm === plan.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="danger"
                              onClick={() => {
                                onDeletePlan?.(plan.id);
                                setDeleteConfirm(null);
                                setExpandedPlan(null);
                              }}
                              icon={Check}
                              className="px-3"
                            />
                            <Button
                              variant="secondary"
                              onClick={() => setDeleteConfirm(null)}
                              icon={X}
                              className="px-3"
                            />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm(plan.id)}
                            icon={Trash2}
                            className="px-4 text-gray-500 hover:text-red-400"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Add new plan button */}
        {plansList.length > 0 && (
          <Button
            variant="secondary"
            className="w-full mt-4"
            icon={Plus}
            onClick={onCreatePlan}
          >
            Add New Routine
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ExercisePreviewCard - Shows exercise with expandable tips
 */
function ExercisePreviewCard({ exercise, isAiGenerated }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetailedTips = exercise.tips && typeof exercise.tips === 'object';
  const quickTip = exercise.tip || exercise.tips?.form?.split('.')[0] || '';

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden">
      {/* Exercise header */}
      <div 
        className={`flex items-center justify-between py-2.5 px-3 ${hasDetailedTips ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetailedTips && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-300 truncate">{exercise.name}</span>
          {exercise.muscleGroup && (
            <span className="text-2xs bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
              {exercise.muscleGroup}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {exercise.sets} × {exercise.range || exercise.reps}
          </span>
          {hasDetailedTips && (
            expanded 
              ? <ChevronUp className="w-4 h-4 text-gray-600" />
              : <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </div>

      {/* Quick tip */}
      {quickTip && !expanded && (
        <div className="px-3 pb-2 flex items-start gap-1.5">
          <Target className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-2xs text-gray-500">{quickTip}</span>
        </div>
      )}

      {/* Expanded tips (for AI-generated) */}
      {expanded && hasDetailedTips && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-700/50 space-y-2 animate-in fade-in">
          {/* Form tip */}
          {exercise.tips.form && (
            <div className="flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400">{exercise.tips.form}</p>
            </div>
          )}

          {/* Form cues */}
          {exercise.tips.cues && (
            <div className="flex flex-wrap gap-1">
              {exercise.tips.cues.map((cue, i) => (
                <span key={i} className="text-2xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                  {cue}
                </span>
              ))}
            </div>
          )}

          {/* Common mistakes */}
          {exercise.tips.mistakes && exercise.tips.mistakes.length > 0 && (
            <div className="flex items-start gap-2">
              <X className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-gray-500">
                <span className="text-red-400 font-medium">Avoid: </span>
                {exercise.tips.mistakes[0]}
              </div>
            </div>
          )}

          {/* Goal */}
          {exercise.tips.goal && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">{exercise.tips.goal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
