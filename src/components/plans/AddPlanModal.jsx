import { useState, useMemo } from 'react';
import { 
  X, Sparkles, ListChecks, ChevronRight, ChevronLeft, 
  Dumbbell, Key, Loader2, Check, Plus, Trash2, Zap, Clock, Target,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WORKOUT_TEMPLATES } from '../onboarding/RoutineCreation';
import { 
  generateWorkoutPlan, 
  calculatePlanIntensity,
  getFocusRecommendations 
} from '../../utils/aiWorkoutGenerator';
import { buildUserContextForAI } from '../../utils/aiContext';
import { checkAiAvailability } from '../../utils/aiConfig';

/**
 * AddPlanModal - Add new workout plan/routine
 * Can choose from templates, AI generate, or create custom
 */
export function AddPlanModal({ 
  isOpen, 
  onClose, 
  onSave,
  apiKey,
  experienceLevel = 'intermediate',
  profile = null,
  workouts = [],
  plans = {},
  streak = 0
}) {
  const [mode, setMode] = useState(null); // 'templates' | 'ai' | 'custom'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Check if AI generation is available
  const effectiveApiKey = localApiKey || apiKey;
  const aiAvailable = useMemo(() => 
    checkAiAvailability({ aiEnabled: true, apiKey: effectiveApiKey }).available,
    [effectiveApiKey]
  );
  
  // AI questions
  const [aiQuestions, setAiQuestions] = useState({
    daysPerWeek: 3,
    focus: 'balanced',
    duration: '45-60',
    equipment: 'full'
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Custom plan state
  const [customPlan, setCustomPlan] = useState({
    name: '',
    desc: '',
    estTime: '45 min',
    exercises: [{ name: '', sets: 3, range: '8-12', tip: '' }]
  });

  const handleClose = () => {
    setMode(null);
    setSelectedTemplate(null);
    setGeneratedPlan(null);
    setError('');
    setCustomPlan({
      name: '',
      desc: '',
      estTime: '45 min',
      exercises: [{ name: '', sets: 3, range: '8-12', tip: '' }]
    });
    onClose();
  };

  const handleSelectTemplate = (templateId) => {
    const template = WORKOUT_TEMPLATES[templateId];
    onSave({
      type: 'template',
      templateId,
      plans: template.plans
    });
    handleClose();
  };

  const handleGeneratePlan = async () => {
    if (!aiAvailable) {
      setError('Please enter a valid API key to generate AI workouts');
      return;
    }
    
    const key = effectiveApiKey;

    setGenerating(true);
    setError('');

    try {
      // Build user context for personalization
      const userContext = buildUserContextForAI({
        profile: { 
          ...profile, 
          experienceLevel: profile?.experience_level || experienceLevel 
        },
        workouts,
        streak,
        plans
      });

      // Generate using enhanced utility
      const result = await generateWorkoutPlan(key, {
        daysPerWeek: aiQuestions.daysPerWeek,
        focus: aiQuestions.focus,
        duration: aiQuestions.duration,
        equipment: aiQuestions.equipment,
        userContext
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setGeneratedPlan(result.data);
      
      // Show warning if there was one
      if (result.warning) {
        console.warn('Generation warning:', result.warning);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptGeneratedPlan = () => {
    onSave({
      type: 'ai-generated',
      plans: generatedPlan.plans,
      apiKey: localApiKey || apiKey
    });
    handleClose();
  };

  const handleSaveCustomPlan = () => {
    if (!customPlan.name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    if (customPlan.exercises.filter(e => e.name.trim()).length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    const planId = `custom_${Date.now()}`;
    onSave({
      type: 'custom',
      plans: {
        [planId]: {
          id: planId,
          name: customPlan.name,
          desc: customPlan.desc,
          estTime: customPlan.estTime,
          next: planId,
          exercises: customPlan.exercises.filter(e => e.name.trim())
        }
      }
    });
    handleClose();
  };

  const addExercise = () => {
    setCustomPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, range: '8-12', tip: '' }]
    }));
  };

  const updateExercise = (index, field, value) => {
    setCustomPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index) => {
    setCustomPlan(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-100">Add New Routine</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-3">
            {/* Templates Option */}
            <button
              onClick={() => setMode('templates')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border-2 border-gray-700 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20">
                  <ListChecks className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-100 group-hover:text-emerald-400">Choose Template</h3>
                  <p className="text-sm text-gray-500">PPL, Upper/Lower, Full Body, Bro Split</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>

            {/* AI Option */}
            <button
              onClick={() => setMode('ai')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border-2 border-gray-700 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-100 group-hover:text-purple-400">AI Generate</h3>
                  <p className="text-sm text-gray-500">Personalized plan based on your goals</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>

            {/* Custom Option */}
            <button
              onClick={() => setMode('custom')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border-2 border-gray-700 hover:border-blue-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20">
                  <Plus className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-100 group-hover:text-blue-400">Create Custom</h3>
                  <p className="text-sm text-gray-500">Build your own routine from scratch</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>
          </div>
        )}

        {/* Templates Selection */}
        {mode === 'templates' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} className="mb-4">
              Back
            </Button>
            <div className="space-y-3">
              {Object.values(WORKOUT_TEMPLATES).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="w-full p-4 rounded-xl bg-gray-800/50 border-2 border-gray-700 hover:border-emerald-500/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-100">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      <span className="text-xs text-emerald-400">{template.frequency}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Generation */}
        {mode === 'ai' && !generatedPlan && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} className="mb-4">
              Back
            </Button>

            {/* API Key */}
            {!apiKey && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google AI API Key
                </label>
                <Input
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="AIza..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your key from Google AI Studio
                </p>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Days per week</label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      onClick={() => setAiQuestions(q => ({ ...q, daysPerWeek: d }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        aiQuestions.daysPerWeek === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Focus</label>
                <div className="grid grid-cols-2 gap-2">
                  {['balanced', 'strength', 'hypertrophy', 'upper body', 'lower body'].map(f => (
                    <button
                      key={f}
                      onClick={() => setAiQuestions(q => ({ ...q, focus: f }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                        aiQuestions.focus === f
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Session Duration</label>
                <div className="flex gap-2">
                  {['30-45', '45-60', '60-75', '75-90'].map(d => (
                    <button
                      key={d}
                      onClick={() => setAiQuestions(q => ({ ...q, duration: d }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        aiQuestions.duration === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Equipment</label>
                <div className="flex gap-2">
                  {[
                    { key: 'full', label: 'Full Gym' },
                    { key: 'minimal', label: 'Minimal' },
                    { key: 'bodyweight', label: 'Bodyweight' }
                  ].map(e => (
                    <button
                      key={e.key}
                      onClick={() => setAiQuestions(q => ({ ...q, equipment: e.key }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        aiQuestions.equipment === e.key
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}

            <Button
              onClick={handleGeneratePlan}
              loading={generating}
              className="w-full"
              icon={Sparkles}
            >
              {generating ? 'Generating...' : 'Generate Plan'}
            </Button>
          </div>
        )}

        {/* AI Generated Preview */}
        {mode === 'ai' && generatedPlan && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold text-gray-100">
                {generatedPlan.programName || 'Plan Generated!'}
              </h3>
              <p className="text-sm text-gray-500">
                {generatedPlan.programDescription || `${Object.keys(generatedPlan.plans).length} workout days created`}
              </p>
            </div>

            {/* Focus recommendations */}
            {aiQuestions.focus && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300 capitalize">{aiQuestions.focus} Focus</span>
                </div>
                <p className="text-xs text-gray-400">
                  {getFocusRecommendations(aiQuestions.focus).description}
                </p>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.values(generatedPlan.plans).map((plan) => (
                <div key={plan.id} className="p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-200">{plan.name}</h4>
                    {plan.intensity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        plan.intensity.level === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                        plan.intensity.level === 'Moderate' ? 'bg-emerald-500/20 text-emerald-400' :
                        plan.intensity.level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <Zap className="w-3 h-3 inline mr-1" />
                        {plan.intensity.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {plan.exercises?.length} exercises
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {plan.estTime}
                    </span>
                    {plan.intensity?.breakdown && (
                      <span className="text-gray-600">
                        {plan.intensity.breakdown.compoundCount} compound
                      </span>
                    )}
                  </div>
                  {plan.desc && (
                    <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Weekly volume summary */}
            {generatedPlan.weeklyVolume && (
              <p className="text-xs text-gray-500 text-center">
                Weekly Volume: {generatedPlan.weeklyVolume}
              </p>
            )}

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setGeneratedPlan(null)} 
                className="flex-1"
                icon={RefreshCw}
              >
                Regenerate
              </Button>
              <Button onClick={handleAcceptGeneratedPlan} className="flex-1">
                Add to My Plans
              </Button>
            </div>
          </div>
        )}

        {/* Custom Plan Builder */}
        {mode === 'custom' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} className="mb-4">
              Back
            </Button>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name *</label>
              <Input
                value={customPlan.name}
                onChange={(e) => setCustomPlan(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Push Day, Upper Body A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <Input
                value={customPlan.desc}
                onChange={(e) => setCustomPlan(p => ({ ...p, desc: e.target.value }))}
                placeholder="Brief description of this workout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Exercises</label>
              <div className="space-y-3">
                {customPlan.exercises.map((ex, i) => (
                  <div key={i} className="p-3 bg-gray-800/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(i, 'name', e.target.value)}
                        placeholder="Exercise name"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeExercise(i)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value) || 3)}
                          placeholder="Sets"
                        />
                        <span className="text-xs text-gray-500">Sets</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={ex.range}
                          onChange={(e) => updateExercise(i, 'range', e.target.value)}
                          placeholder="8-12"
                        />
                        <span className="text-xs text-gray-500">Rep Range</span>
                      </div>
                    </div>
                    <Input
                      value={ex.tip}
                      onChange={(e) => updateExercise(i, 'tip', e.target.value)}
                      placeholder="Form tip (optional)"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={addExercise}
                className="w-full mt-3"
                icon={Plus}
              >
                Add Exercise
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
            )}

            <Button onClick={handleSaveCustomPlan} className="w-full">
              Save Plan
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AddPlanModal;
