import { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Plus, GripVertical, ChevronUp, ChevronDown,
  Dumbbell, Clock, Edit3, AlertCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * EditPlanModal - Edit existing workout plan
 * Allows renaming, updating exercises, reordering
 */
export function EditPlanModal({ 
  isOpen, 
  onClose, 
  plan,
  onSave
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [estTime, setEstTime] = useState('45 min');
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when plan changes
  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setDesc(plan.desc || '');
      setEstTime(plan.estTime || '45 min');
      setExercises(plan.exercises?.map((ex, i) => ({ ...ex, _id: i })) || []);
      setHasChanges(false);
      setError('');
    }
  }, [plan]);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const markChanged = () => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    if (exercises.filter(e => e.name?.trim()).length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        desc: desc.trim(),
        estTime,
        exercises: exercises
          .filter(e => e.name?.trim())
          .map(({ _id, ...ex }) => ex) // Remove internal _id
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const addExercise = () => {
    setExercises(prev => [
      ...prev, 
      { _id: Date.now(), name: '', sets: 3, range: '8-12', tip: '' }
    ]);
    markChanged();
  };

  const updateExercise = (index, field, value) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
    markChanged();
  };

  const removeExercise = (index) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
    markChanged();
  };

  const moveExercise = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    
    const newExercises = [...exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setExercises(newExercises);
    markChanged();
  };

  if (!plan) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Edit3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Edit Plan</h2>
              {hasChanges && (
                <span className="text-xs text-amber-400">Unsaved changes</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Plan Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plan Name *
            </label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); markChanged(); }}
              placeholder="e.g., Push Day, Upper Body A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Input
              value={desc}
              onChange={(e) => { setDesc(e.target.value); markChanged(); }}
              placeholder="Brief description of this workout"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Duration
            </label>
            <div className="flex gap-2">
              {['30-45 min', '45 min', '45-60 min', '60 min', '60-75 min'].map(time => (
                <button
                  key={time}
                  onClick={() => { setEstTime(time); markChanged(); }}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    estTime === time
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">
              Exercises ({exercises.length})
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addExercise}
              icon={Plus}
              className="text-emerald-400"
            >
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div 
                key={ex._id} 
                className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 space-y-3"
              >
                {/* Exercise header with reorder buttons */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveExercise(i, -1)}
                      disabled={i === 0}
                      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveExercise(i, 1)}
                      disabled={i === exercises.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-medium w-6">
                    {i + 1}.
                  </span>
                  <Input
                    value={ex.name || ''}
                    onChange={(e) => updateExercise(i, 'name', e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeExercise(i)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets and Reps */}
                <div className="flex gap-3 pl-12">
                  <div className="flex-1">
                    <label className="text-2xs text-gray-500 block mb-1">Sets</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={ex.sets || 3}
                      onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-2xs text-gray-500 block mb-1">Rep Range</label>
                    <Input
                      value={ex.range || ex.reps || '8-12'}
                      onChange={(e) => updateExercise(i, 'range', e.target.value)}
                      placeholder="8-12"
                    />
                  </div>
                </div>

                {/* Form tip */}
                <div className="pl-12">
                  <label className="text-2xs text-gray-500 block mb-1">Form Tip (optional)</label>
                  <Input
                    value={ex.tip || ''}
                    onChange={(e) => updateExercise(i, 'tip', e.target.value)}
                    placeholder="Quick form reminder"
                  />
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exercises yet</p>
                <Button
                  variant="ghost"
                  onClick={addExercise}
                  icon={Plus}
                  className="mt-2"
                >
                  Add Exercise
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="flex-1"
            icon={Save}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditPlanModal;
