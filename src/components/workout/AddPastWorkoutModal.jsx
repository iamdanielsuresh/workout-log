import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Dumbbell, Plus, Minus, Save, X, AlertCircle, 
  ChevronDown, FileText, LayoutList, Timer
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';

/**
 * Add Past Workout Modal
 * Task 10: Allow users to log past workouts by selecting a date
 * Revamped for premium aesthetic and better mobile experience
 */
export function AddPastWorkoutModal({ 
  isOpen, 
  onClose, 
  onSave,
  plans,
  onToast
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
    if (isOpen) {
      const today = new Date();
      setWorkoutDate(today.toISOString().split('T')[0]);
      setWorkoutTime('');
      setSelectedPlan(null);
      setWorkoutName('');
      setExercises([]);
      setNote('');
      setDuration('30');
      setErrors({});
    }
  }, [isOpen]);

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
        // Task 10: Include date and time for past workouts
        workoutDate: workoutDate,
        startTime: workoutTime 
          ? new Date(`${workoutDate}T${workoutTime}`).toISOString()
          : new Date(`${workoutDate}T12:00:00`).toISOString()
      };

      await onSave(workoutData);
      onToast?.({ message: 'Past workout logged!', type: 'success' });
      onClose();
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

  // Custom Select Component
  const Select = ({ value, onChange, options, icon: Icon, placeholder, className = '' }) => (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />}
      <select
        value={value}
        onChange={onChange}
        className={`
          w-full bg-gray-900/50 border border-white/10
          text-gray-100 placeholder:text-gray-600
          rounded-xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50
          appearance-none
          ${Icon ? 'pl-10 pr-10' : 'px-4 pr-10'} py-3
          ${className}
        `}
      >
        <option value="">{placeholder || 'Select'}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Past Workout">
      <div className="space-y-8 pb-4">
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
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
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
              <div key={exIndex} className="bg-gray-900/50 border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <Input
                      value={exercise.name}
                      onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                      placeholder="Exercise name"
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exIndex)}
                    className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Sets */}
                <div className="space-y-2 pl-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500 w-10 pt-1">#{setIndex + 1}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                            placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 pointer-events-none">kg</span>
                        </div>
                        <span className="text-gray-600">×</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                            placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 pointer-events-none">reps</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                        disabled={exercise.sets.length <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSet(exIndex)}
                    className="w-full text-xs font-medium text-gray-500 hover:text-emerald-400 py-2 border border-dashed border-gray-800 hover:border-emerald-500/30 rounded-lg transition-all mt-2"
                  >
                    + Add Set
                  </button>
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-xl">
                <Dumbbell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No exercises added yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddExercise}
                  className="mt-2"
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
        <div className="pt-4 sticky bottom-0 bg-gray-900/95 backdrop-blur pb-2 -mx-4 px-4 border-t border-white/5 mt-8">
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
    </Modal>
  );
}

export default AddPastWorkoutModal;
