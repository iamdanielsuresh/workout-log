import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Dumbbell, Plus, Minus, Save, X, AlertCircle, 
  ChevronDown, FileText, LayoutList, Timer
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { ViewHeader } from '../layout/Navigation';

/**
 * Log Past Workout View
 * Full-screen view to log past workouts
 */
export function LogPastWorkoutView({ 
  onBack, 
  onSave,
  plans,
  onToast,
  initialExercise
}) {
  const [workoutDate, setWorkoutDate] = useState('');
  const [workoutTime, setWorkoutTime] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    setWorkoutDate(today.toISOString().split('T')[0]);
    setWorkoutTime('');
    setSelectedPlan(null);
    
    if (initialExercise) {
      setWorkoutName(`${initialExercise.name} Workout`);
      setExercises([{
        name: initialExercise.name,
        sets: [{ weight: '', reps: '' }]
      }]);
    } else {
      setWorkoutName('');
      setExercises([]);
    }
    
    setNote('');
    setDuration('30');
    setErrors({});
  }, [initialExercise]);

  // Load exercises from selected plan
  useEffect(() => {
    if (selectedPlan && plans && plans[selectedPlan]) {
      const plan = plans[selectedPlan];
      setWorkoutName(plan.name);
      setExercises(
        plan.exercises?.map(ex => ({
          name: ex.name,
          sets: Array(ex.sets || 3).fill(null).map(() => ({
            weight: '',
            reps: ''
          }))
        })) || []
      );
    }
  }, [selectedPlan, plans]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!workoutDate) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(workoutDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = 'Cannot log future workouts';
      }
    }
    
    if (!workoutName.trim()) {
      newErrors.name = 'Workout name is required';
    }
    
    if (exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExercise = () => {
    setExercises(prev => [...prev, {
      name: '',
      sets: [{ weight: '', reps: '' }]
    }]);
  };

  const handleRemoveExercise = (index) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseNameChange = (index, name) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, name } : ex
    ));
  };

  const handleAddSet = (exerciseIndex) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exerciseIndex 
        ? { ...ex, sets: [...ex.sets, { weight: '', reps: '' }] }
        : ex
    ));
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exerciseIndex 
        ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) }
        : ex
    ));
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exerciseIndex 
        ? {
            ...ex,
            sets: ex.sets.map((s, si) => 
              si === setIndex ? { ...s, [field]: value } : s
            )
          }
        : ex
    ));
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Build workout data
      const workoutData = {
        workoutType: selectedPlan || 'custom',
        workoutName: workoutName.trim(),
        exercises: exercises.filter(ex => ex.name.trim()).map(ex => ({
          name: ex.name.trim(),
          sets: ex.sets.filter(s => s.weight || s.reps).map(s => ({
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps) || 0
          }))
        })),
        note: note.trim(),
        duration: parseInt(duration) * 60 || 0,
        // Include date and time for past workouts
        workoutDate: workoutDate,
        startTime: workoutTime 
          ? new Date(`${workoutDate}T${workoutTime}`).toISOString()
          : new Date(`${workoutDate}T12:00:00`).toISOString()
      };

      await onSave(workoutData);
      onToast?.({ message: 'Past workout logged!', type: 'success' });
      onBack();
    } catch (error) {
      console.error('Error saving workout:', error);
      onToast?.({ message: 'Failed to save workout', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const planOptions = plans ? Object.entries(plans).map(([id, plan]) => ({
    id,
    name: plan.name
  })) : [];

  // Get max date (today)
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-950">
      <ViewHeader 
        title="Log Past Workout" 
        onBack={onBack}
        rightAction={
          <Button 
            size="sm" 
            icon={Save} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="p-6 space-y-8 pb-32">
        {/* Section: Date & Time */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> When was it?
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Date <span className="text-red-400">*</span></label>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                max={maxDate}
                icon={Calendar}
                error={errors.date}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Time</label>
              <Input
                type="time"
                value={workoutTime}
                onChange={(e) => setWorkoutTime(e.target.value)}
                icon={Clock}
              />
            </div>
          </div>
        </div>

        {/* Section: Workout Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Workout Details
          </h4>

          {/* Load from Plan */}
          {planOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Load from routine</label>
              <Select
                value={selectedPlan || ''}
                onChange={(e) => setSelectedPlan(e.target.value || null)}
                icon={LayoutList}
                placeholder="Custom workout"
                options={planOptions.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Workout Name <span className="text-red-400">*</span></label>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Push Day"
                icon={Dumbbell}
                error={errors.name}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (min)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                icon={Timer}
              />
            </div>
          </div>
        </div>

        {/* Section: Exercises */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutList className="w-4 h-4" /> Exercises
            </h4>
            <button
              onClick={handleAddExercise}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
            >
              <Plus className="w-3 h-3" />
              Add Exercise
            </button>
          </div>
          
          {errors.exercises && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400">{errors.exercises}</p>
            </div>
          )}

          <div className="space-y-3">
            {exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="bg-gray-900/30 border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <Input
                      value={exercise.name}
                      onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                      placeholder="Exercise name"
                      className="bg-gray-900 border-white/10 focus:border-emerald-500/50"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exIndex)}
                    className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Sets Header */}
                <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-3 mb-2 px-1">
                  <span className="text-[10px] font-bold text-gray-600 uppercase text-center">#</span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase text-center">Weight</span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase text-center">Reps</span>
                  <span></span>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-[24px_1fr_1fr_32px] gap-3 items-center">
                      <span className="text-xs font-mono text-gray-500 text-center">{setIndex + 1}</span>
                      
                      <div className="relative">
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                          placeholder="0"
                          className="w-full bg-gray-900 border border-white/10 rounded-lg py-2 px-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center transition-colors"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 pointer-events-none">kg</span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                          placeholder="0"
                          className="w-full bg-gray-900 border border-white/10 rounded-lg py-2 px-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center transition-colors"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 pointer-events-none">reps</span>
                      </div>

                      <button
                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        disabled={exercise.sets.length <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => handleAddSet(exIndex)}
                    className="w-full text-xs font-medium text-emerald-400 hover:text-emerald-300 py-2.5 border border-dashed border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg transition-all mt-3 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Set
                  </button>
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 mb-4">No exercises added yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddExercise}
                  icon={Plus}
                >
                  Add First Exercise
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Section: Notes */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Notes
          </h4>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did the workout feel? Any PRs?"
            rows={3}
            className="bg-gray-900/50 border-white/10"
          />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur p-4 border-t border-white/5 z-10">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving}
              className="w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              icon={Save}
            >
              Save Workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogPastWorkoutView;
