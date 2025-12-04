import { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Plus, GripVertical, ChevronUp, ChevronDown,
  Dumbbell, Clock, Edit3, AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ViewHeader } from '../layout/Navigation';

/**
 * EditPlanView - Edit existing workout plan (Full Page)
 * Allows renaming, updating exercises, reordering
 */
export function EditPlanView({ 
  plan,
  onBack,
  onSave,
  onDelete
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

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        onBack();
      }
    } else {
      onBack();
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

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-in fade-in duration-300">
      <ViewHeader 
        title="Edit Plan" 
        onBack={handleBack}
        rightAction={
          <Button 
            size="sm" 
            icon={Save} 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <Card hover={false} className="p-4 space-y-4 bg-gray-800/30">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Routine Name</label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); markChanged(); }}
                placeholder="e.g., Push Day"
                className="font-display font-bold text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
              <Input
                value={desc}
                onChange={(e) => { setDesc(e.target.value); markChanged(); }}
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Est. Time</label>
              <Input
                value={estTime}
                onChange={(e) => { setEstTime(e.target.value); markChanged(); }}
                placeholder="e.g., 45 min"
                icon={Clock}
              />
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exercises</label>
              <span className="text-xs text-gray-500">{exercises.length} exercises</span>
            </div>
            
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <div key={ex._id || i} className="group relative p-4 bg-gray-800/40 border border-gray-700/50 rounded-2xl space-y-3 hover:border-gray-600 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-3 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(i, 'name', e.target.value)}
                        placeholder="Exercise name"
                        className="font-display font-bold text-lg bg-gray-900/50 border-transparent focus:bg-gray-900"
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Sets</label>
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value) || 3)}
                            placeholder="3"
                            className="bg-gray-900/50 border-transparent focus:bg-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Rep Range</label>
                          <Input
                            value={ex.range}
                            onChange={(e) => updateExercise(i, 'range', e.target.value)}
                            placeholder="8-12"
                            className="bg-gray-900/50 border-transparent focus:bg-gray-900"
                          />
                        </div>
                      </div>
                      
                      <Input
                        value={ex.tip}
                        onChange={(e) => updateExercise(i, 'tip', e.target.value)}
                        placeholder="Add a form tip (optional)"
                        className="text-sm bg-gray-900/50 border-transparent focus:bg-gray-900"
                      />
                    </div>
                    
                    <button
                      onClick={() => removeExercise(i)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="secondary"
              onClick={addExercise}
              className="w-full mt-4 border-dashed border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
              icon={Plus}
            >
              Add Exercise
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="pt-4 sticky bottom-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pb-2">
          <Button 
            onClick={handleSave} 
            loading={saving}
            className="w-full shadow-lg shadow-emerald-500/20" 
            size="lg"
            icon={Save}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditPlanView;
