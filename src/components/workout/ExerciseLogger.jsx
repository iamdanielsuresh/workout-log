import { useState } from 'react';
import { Check, History, Minus, Plus, TrendingUp, TrendingDown, Sparkles, Info, Target, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { NumberInput } from '../ui/Input';
import { sanitizeWeight, sanitizeReps } from '../../utils/sanitize';

/**
 * Exercise logger card with set tracking and detailed tips
 */
export function ExerciseLogger({ 
  exercise, 
  lastLog, 
  onUpdate,
  onSave,
  aiTip,
  onRequestTip,
  onShowInfo,
  onSuggestWeight,
  aiLoading = false,
  isCompleted = false 
}) {
  const [sets, setSets] = useState(() => {
    return Array(exercise.sets).fill(null).map((_, i) => ({
      weight: lastLog?.sets?.[i]?.weight || lastLog?.sets?.[0]?.weight || '',
      reps: ''
    }));
  });
  const [showTips, setShowTips] = useState(false);
  const [suggestingWeight, setSuggestingWeight] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleChange = (idx, field, value) => {
    // Sanitize input based on field type
    const sanitizedValue = field === 'weight' 
      ? sanitizeWeight(value) 
      : sanitizeReps(value);
    
    const newSets = [...sets];
    newSets[idx] = { ...newSets[idx], [field]: sanitizedValue };
    setSets(newSets);
    onUpdate?.(newSets);

    // Haptic feedback when set is completed (both fields filled)
    if (sanitizedValue && newSets[idx].weight && newSets[idx].reps) {
      const otherField = field === 'weight' ? 'reps' : 'weight';
      // Only vibrate if the other field was already present (meaning we just completed the set)
      if (sets[idx][otherField] && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const handleIncrement = (idx, field, delta) => {
    if (navigator.vibrate) navigator.vibrate(5); // Light tap
    const currentVal = parseFloat(sets[idx][field]) || 0;
    const increment = field === 'weight' ? 2.5 : 1;
    const newVal = Math.max(0, currentVal + (delta * increment));
    handleChange(idx, field, newVal.toString());
  };

  const copyFromLast = () => {
    if (!lastLog?.sets) return;
    const newSets = sets.map((set, i) => ({
      weight: lastLog.sets[i]?.weight || lastLog.sets[0]?.weight || set.weight,
      reps: lastLog.sets[i]?.reps || ''
    }));
    setSets(newSets);
    onUpdate?.(newSets);
  };

  const handleSuggestWeight = async () => {
    if (!onSuggestWeight || suggestingWeight) return;
    
    setSuggestingWeight(true);
    try {
      // Parse target reps from range (e.g. "8-12" -> 10)
      const range = exercise.range || '10';
      const targetReps = range.includes('-') 
        ? Math.round((parseInt(range.split('-')[0]) + parseInt(range.split('-')[1])) / 2)
        : parseInt(range);

      const weight = await onSuggestWeight(targetReps);
      
      if (weight) {
        const newSets = sets.map(set => ({
          ...set,
          weight: weight.toString()
        }));
        setSets(newSets);
        onUpdate?.(newSets);
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      }
    } catch (error) {
      console.error('Error suggesting weight:', error);
    } finally {
      setSuggestingWeight(false);
    }
  };

  const handleAddSet = () => {
    const newSets = [...sets, { weight: sets[sets.length - 1]?.weight || '', reps: '' }];
    setSets(newSets);
    onUpdate?.(newSets);
  };

  const handleRemoveSet = (index) => {
    if (sets.length <= 1) return;
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
    onUpdate?.(newSets);
  };

  const handleSave = () => {
    if (!onSave) return;
    setIsExiting(true);
    setTimeout(() => {
      onSave(sets);
    }, 500);
  };

  // Check if exercise has detailed tips (from AI-generated plans)
  const hasDetailedTips = exercise.tips && typeof exercise.tips === 'object';
  const quickTip = exercise.tip || exercise.tips?.form?.split('.')[0] || '';

  return (
    <Card 
      variant={isCompleted ? 'accent' : 'default'} 
      hover={false}
      className={`${isCompleted ? 'ring-1 ring-emerald-500/30' : ''} ${isExiting ? 'opacity-0 translate-x-full transition-all duration-500 ease-in-out' : ''}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800/50 flex justify-between items-start select-none">
        <div className="flex items-start gap-3">
          {isCompleted && (
            <div className="mt-1 p-1 bg-emerald-500/20 rounded-full">
              <Check className="w-3 h-3 text-emerald-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-gray-100 tracking-tight">{exercise.name}</h3>
              {exercise.muscleGroup && (
                <span className="text-2xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  {exercise.muscleGroup}
                </span>
              )}
            </div>
            <span className="text-2xs font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded mt-1 inline-block">
              {exercise.sets} sets × {exercise.range}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowInfo && (
            <button
              onClick={() => onShowInfo(exercise)}
              className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Exercise info"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          {lastLog && (
            <button
              onClick={copyFromLast}
              className="text-2xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              Copy Last
            </button>
          )}
          {onSuggestWeight && lastLog && (
            <button
              onClick={handleSuggestWeight}
              disabled={suggestingWeight}
              className="text-2xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {suggestingWeight ? (
                <Sparkles className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Suggest
            </button>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gray-900/50 p-3 border-b border-gray-800/50 space-y-2 select-none">
        {/* Quick Tip */}
        {quickTip && (
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400">{quickTip}</p>
          </div>
        )}

        {/* Expandable detailed tips for AI-generated exercises */}
        {hasDetailedTips && (
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1 text-2xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTips ? 'Hide tips' : 'Show form cues & tips'}
          </button>
        )}

        {showTips && hasDetailedTips && (
          <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
            {/* Form cues */}
            {exercise.tips.cues && (
              <div className="flex flex-wrap gap-1.5">
                {exercise.tips.cues.map((cue, i) => (
                  <span key={i} className="text-2xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                    {cue}
                  </span>
                ))}
              </div>
            )}
            
            {/* Goal */}
            {exercise.tips.goal && (
              <p className="text-2xs text-gray-500 italic">
                <span className="text-gray-400 font-medium">Goal:</span> {exercise.tips.goal}
              </p>
            )}
          </div>
        )}

        {/* Last session */}
        {lastLog && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <History className="w-3 h-3 shrink-0" />
            <span className="font-medium">Last:</span>
            {lastLog.sets.map((s, i) => (
              <span key={i} className="text-amber-300">
                {s.weight}kg×{s.reps}{i < lastLog.sets.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        {/* AI Tip */}
        {aiTip ? (
          <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 animate-in fade-in">
            <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{aiTip}</span>
          </div>
        ) : onRequestTip && (
          <button
            onClick={onRequestTip}
            disabled={aiLoading}
            className="text-2xs font-semibold text-emerald-400 flex items-center gap-1.5 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Getting tip...' : 'Get AI Tip'}
          </button>
        )}
      </div>

      {/* Sets */}
      <div className="p-4 space-y-3">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`w-6 text-sm font-display font-bold text-center select-none ${
              set.weight && set.reps ? 'text-emerald-400' : 'text-gray-600'
            }`}>
              {set.weight && set.reps ? (
                <Check className="w-4 h-4 mx-auto" />
              ) : (
                i + 1
              )}
            </span>

            {/* Weight input */}
            <div className="flex-1 flex items-center bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden group focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <button
                onClick={() => handleIncrement(i, 'weight', -1)}
                className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors select-none"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                placeholder="kg"
                value={set.weight}
                onChange={(e) => handleChange(i, 'weight', e.target.value)}
                className="flex-1 bg-transparent text-center text-gray-100 font-display font-bold text-lg placeholder:text-gray-600 focus:outline-none min-w-0 py-2"
              />
              <button
                onClick={() => handleIncrement(i, 'weight', 1)}
                className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors select-none"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Reps input */}
            <div className="flex-1 flex items-center bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => handleIncrement(i, 'reps', -1)}
                className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors select-none"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                placeholder="reps"
                value={set.reps}
                onChange={(e) => handleChange(i, 'reps', e.target.value)}
                className="flex-1 bg-transparent text-center text-gray-100 font-display font-bold text-lg placeholder:text-gray-600 focus:outline-none min-w-0 py-2"
              />
              <button
                onClick={() => handleIncrement(i, 'reps', 1)}
                className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors select-none"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Weight comparison */}
            <div className="w-10">
              <WeightComparison 
                current={set.weight} 
                previous={lastLog?.sets?.[i]?.weight || lastLog?.sets?.[0]?.weight} 
              />
            </div>

            {/* Remove set button */}
            {sets.length > 1 && (
              <button
                onClick={() => handleRemoveSet(i)}
                className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                aria-label="Remove set"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddSet}
            className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-800/50 hover:text-gray-200 rounded-xl border border-dashed border-gray-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Set
          </button>
          
          {onSave && (
            <button
              onClick={handleSave}
              className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-100 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Weight comparison indicator
 */
function WeightComparison({ current, previous }) {
  if (!previous || !current) return null;

  const currentNum = parseFloat(current);
  const previousNum = parseFloat(previous);

  if (isNaN(currentNum) || isNaN(previousNum) || currentNum === previousNum) return null;

  const diff = currentNum - previousNum;
  const isUp = diff > 0;

  return (
    <span className={`flex items-center gap-0.5 text-2xs font-bold ${
      isUp ? 'text-emerald-400' : 'text-red-400'
    }`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{diff.toFixed(1)}
    </span>
  );
}
