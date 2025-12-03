import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Dumbbell, Plus, Minus, Save, X, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';

/**
 * Add Past Workout Modal
 * Task 10: Allow users to log past workouts by selecting a date
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Past Workout">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto">
        {/* Date & Time Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              max={maxDate}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            />
            {errors.date && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.date}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Time (optional)
            </label>
            <input
              type="time"
              value={workoutTime}
              onChange={(e) => setWorkoutTime(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Load from Plan */}
        {planOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Load from routine (optional)
            </label>
            <select
              value={selectedPlan || ''}
              onChange={(e) => setSelectedPlan(e.target.value || null)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            >
              <option value="">Custom workout</option>
              {planOptions.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Workout Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Workout Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Push Day, Leg Workout"
            icon={Dumbbell}
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Duration (minutes)
          </label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            icon={Clock}
          />
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">
              Exercises <span className="text-red-400">*</span>
            </label>
            <button
              onClick={handleAddExercise}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Exercise
            </button>
          </div>
          
          {errors.exercises && (
            <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.exercises}
            </p>
          )}

          <div className="space-y-3">
            {exercises.map((exercise, exIndex) => (
              <Card key={exIndex} hover={false} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={exercise.name}
                    onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1"
                  />
                  <button
                    onClick={() => handleRemoveExercise(exIndex)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">Set {setIndex + 1}</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                        placeholder="kg"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center"
                      />
                      <span className="text-gray-600">×</span>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                        placeholder="reps"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 text-sm focus:border-emerald-500 outline-none text-center"
                      />
                      <button
                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        disabled={exercise.sets.length <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSet(exIndex)}
                    className="w-full text-xs text-gray-500 hover:text-emerald-400 py-1 transition-colors"
                  >
                    + Add Set
                  </button>
                </div>
              </Card>
            ))}

            {exercises.length === 0 && (
              <Card hover={false} className="p-6 text-center">
                <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No exercises added yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddExercise}
                  className="mt-2"
                >
                  Add Exercise
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Note (optional)
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did the workout feel?"
            rows={2}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saving}
          className="w-full"
          icon={Save}
        >
          Save Workout
        </Button>
      </div>
    </Modal>
  );
}

export default AddPastWorkoutModal;
