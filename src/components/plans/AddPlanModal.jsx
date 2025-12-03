import { useState, useMemo, useCallback } from 'react';
import { 
  X, Sparkles, ListChecks, ChevronRight, ChevronLeft, 
  Dumbbell, Key, Loader2, Check, Plus, Trash2, Zap, Clock, Target,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info
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
    equipment: 'full',
    specialNotes: ''
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [loadingAlternative, setLoadingAlternative] = useState(null);

  // Custom plan state
  const [customPlan, setCustomPlan] = useState({
    name: '',
    desc: '',
    estTime: '45 min',
    exercises: [{ name: '', sets: 3, range: '8-12', tip: '' }]
  });

  const handleClose = useCallback(() => {
    setMode(null);
    setSelectedTemplate(null);
    setGeneratedPlan(null);
    setExpandedDays({});
    setExpandedExercises({});
    setLoadingAlternative(null);
    setError('');
    setCustomPlan({
      name: '',
      desc: '',
      estTime: '45 min',
      exercises: [{ name: '', sets: 3, range: '8-12', tip: '' }]
    });
    onClose();
  }, [onClose]);

  const toggleDayExpanded = (dayId) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const toggleExerciseExpanded = (exerciseKey) => {
    setExpandedExercises(prev => ({ ...prev, [exerciseKey]: !prev[exerciseKey] }));
  };

  const findAlternativeExercise = async (dayId, exerciseIndex, exercise) => {
    const loadingKey = `${dayId}-${exerciseIndex}`;
    setLoadingAlternative(loadingKey);
    const key = effectiveApiKey;

    try {
      const prompt = `Suggest ONE alternative exercise to replace "${exercise.name}" that targets the same muscle group (${exercise.muscleGroup || 'similar muscles'}).

Requirements:
- Equipment: ${aiQuestions.equipment === 'full' ? 'Full gym' : aiQuestions.equipment === 'minimal' ? 'Minimal equipment' : 'Bodyweight'}
- Experience level: ${experienceLevel}
${aiQuestions.specialNotes ? `- User notes: ${aiQuestions.specialNotes}` : ''}

Return ONLY valid JSON (no markdown):
{
  "name": "Alternative Exercise Name",
  "sets": ${exercise.sets},
  "range": "${exercise.range}",
  "muscleGroup": "${exercise.muscleGroup || 'Primary muscle'}",
  "tip": "Quick form tip",
  "tips": {
    "form": "Detailed form instructions",
    "cues": ["Cue 1", "Cue 2"],
    "mistakes": ["Common mistake"],
    "goal": "What this achieves",
    "progression": "How to progress"
  },
  "reason": "Brief reason why this is a good alternative"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) throw new Error('Failed to get alternative');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const alternative = JSON.parse(cleanedText);

      // Update the generated plan with the alternative
      setGeneratedPlan(prev => {
        const newPlan = JSON.parse(JSON.stringify(prev));
        newPlan.plans[dayId].exercises[exerciseIndex] = {
          ...alternative,
          replacedFrom: exercise.name
        };
        return newPlan;
      });
    } catch (err) {
      console.error('Error finding alternative:', err);
      setError('Failed to find alternative. Try again.');
    } finally {
      setLoadingAlternative(null);
    }
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
        specialNotes: aiQuestions.specialNotes,
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
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-100">Add New Routine</h2>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-3">
            {/* Templates Option */}
            <button
              onClick={() => setMode('templates')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <ListChecks className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">Choose Template</h3>
                  <p className="text-sm text-gray-500">PPL, Upper/Lower, Full Body, Bro Split</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </button>

            {/* AI Option */}
            <button
              onClick={() => setMode('ai')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/70 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 group-hover:text-purple-400 transition-colors">AI Generate</h3>
                  <p className="text-sm text-gray-500">Personalized plan based on your goals</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </button>

            {/* Custom Option */}
            <button
              onClick={() => setMode('custom')}
              className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/70 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Plus className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">Create Custom</h3>
                  <p className="text-sm text-gray-500">Build your own routine from scratch</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* Templates Selection */}
        {mode === 'templates' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} size="sm" className="mb-2">
              Back
            </Button>
            <div className="space-y-3">
              {Object.values(WORKOUT_TEMPLATES).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      <span className="text-xs text-emerald-400 font-medium">{template.frequency}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Generation */}
        {mode === 'ai' && !generatedPlan && (
          <div className="space-y-5">
            <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} size="sm" className="mb-2">
              Back
            </Button>

            {/* API Key */}
            {!apiKey && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google AI API Key
                </label>
                <Input
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your key from Google AI Studio
                </p>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-5">
              {/* Days per week */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Days per week</label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      onClick={() => setAiQuestions(q => ({ ...q, daysPerWeek: d }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        aiQuestions.daysPerWeek === d
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Focus</label>
                <div className="grid grid-cols-2 gap-2">
                  {['balanced', 'strength', 'hypertrophy', 'upper body', 'lower body'].map(f => (
                    <button
                      key={f}
                      onClick={() => setAiQuestions(q => ({ ...q, focus: f }))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all capitalize ${
                        aiQuestions.focus === f
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Session Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {['30-45', '45-60', '60-75', '75-90'].map(d => (
                    <button
                      key={d}
                      onClick={() => setAiQuestions(q => ({ ...q, duration: d }))}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                        aiQuestions.duration === d
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Equipment</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'full', label: 'Full Gym' },
                    { key: 'minimal', label: 'Minimal' },
                    { key: 'bodyweight', label: 'Bodyweight' }
                  ].map(e => (
                    <button
                      key={e.key}
                      onClick={() => setAiQuestions(q => ({ ...q, equipment: e.key }))}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                        aiQuestions.equipment === e.key
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Notes / Limitations - Enhanced for mobile keyboard */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-2 text-gray-500" />
                  Anything AI should know?
                </label>
                <textarea
                  value={aiQuestions.specialNotes}
                  onChange={(e) => setAiQuestions(q => ({ ...q, specialNotes: e.target.value }))}
                  onFocus={(e) => {
                    // Scroll textarea into view when focused on mobile
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  placeholder="E.g., shoulder injury, don't like bench press, focus on back..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none text-sm transition-all"
                  rows={3}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Generate Button - Sticky on mobile */}
            <div className="pt-2">
              <Button
                onClick={handleGeneratePlan}
                loading={generating}
                className="w-full"
                size="lg"
                icon={Sparkles}
              >
                {generating ? 'Generating...' : 'Generate Plan'}
              </Button>
            </div>
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
                Tap days to expand • Tap exercises for details
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

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

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {Object.entries(generatedPlan.plans).map(([dayId, plan]) => {
                const isDayExpanded = expandedDays[dayId];
                
                return (
                  <div key={dayId} className="bg-gray-800/50 rounded-xl overflow-hidden">
                    {/* Day Header - Clickable */}
                    <button
                      onClick={() => toggleDayExpanded(dayId)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {plan.exercises?.length} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.estTime}
                          </span>
                        </div>
                      </div>
                      {isDayExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {/* Expanded Day Content */}
                    {isDayExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {plan.desc && (
                          <p className="text-xs text-gray-500 mb-2">{plan.desc}</p>
                        )}
                        {plan.dayTip && (
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mb-2">
                            <p className="text-xs text-purple-300">💡 {plan.dayTip}</p>
                          </div>
                        )}
                        
                        {plan.exercises?.map((ex, exIdx) => {
                          const exerciseKey = `${dayId}-${exIdx}`;
                          const isExerciseExpanded = expandedExercises[exerciseKey];
                          const isLoadingAlt = loadingAlternative === exerciseKey;
                          
                          return (
                            <div 
                              key={exIdx} 
                              className="bg-gray-900/50 rounded-lg overflow-hidden"
                            >
                              {/* Exercise Row - Clickable */}
                              <button
                                onClick={() => toggleExerciseExpanded(exerciseKey)}
                                className="w-full p-2 flex items-center justify-between text-left"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-200 text-sm">{ex.name}</span>
                                    {ex.replacedFrom && (
                                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                                        swapped
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">{ex.sets} × {ex.range}</span>
                                    {ex.muscleGroup && (
                                      <>
                                        <span className="text-gray-700">•</span>
                                        <span className="text-xs text-gray-600">{ex.muscleGroup}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isExerciseExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <Info className="w-4 h-4 text-gray-600" />
                                )}
                              </button>

                              {/* Expanded Exercise Details */}
                              {isExerciseExpanded && (
                                <div className="px-2 pb-2 space-y-2">
                                  {/* Form Tip */}
                                  {(ex.tip || ex.tips?.form) && (
                                    <div className="bg-gray-800/50 rounded p-2">
                                      <p className="text-xs font-medium text-gray-400 mb-1">Form</p>
                                      <p className="text-xs text-gray-300">{ex.tips?.form || ex.tip}</p>
                                    </div>
                                  )}

                                  {/* Cues */}
                                  {ex.tips?.cues?.length > 0 && (
                                    <div className="bg-gray-800/50 rounded p-2">
                                      <p className="text-xs font-medium text-gray-400 mb-1">Cues</p>
                                      <div className="flex flex-wrap gap-1">
                                        {ex.tips.cues.map((cue, i) => (
                                          <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                            {cue}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Common Mistakes */}
                                  {ex.tips?.mistakes?.length > 0 && (
                                    <div className="bg-red-500/5 border border-red-500/10 rounded p-2">
                                      <p className="text-xs font-medium text-red-400 mb-1">Avoid</p>
                                      <ul className="text-xs text-gray-400 space-y-0.5">
                                        {ex.tips.mistakes.map((m, i) => (
                                          <li key={i}>• {m}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Goal */}
                                  {ex.tips?.goal && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded p-2">
                                      <p className="text-xs font-medium text-emerald-400 mb-1">Goal</p>
                                      <p className="text-xs text-gray-300">{ex.tips.goal}</p>
                                    </div>
                                  )}

                                  {/* Replaced Info */}
                                  {ex.replacedFrom && ex.reason && (
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                                      <p className="text-xs text-purple-300">
                                        Replaced {ex.replacedFrom}: {ex.reason}
                                      </p>
                                    </div>
                                  )}

                                  {/* Find Alternative Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      findAlternativeExercise(dayId, exIdx, ex);
                                    }}
                                    disabled={isLoadingAlt}
                                    className="w-full mt-1 py-2 px-3 bg-gray-700/50 hover:bg-gray-700 rounded flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                                  >
                                    {isLoadingAlt ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Finding alternative...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3 h-3" />
                                        Find Alternative
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" onClick={() => setMode(null)} icon={ChevronLeft} size="sm">
                Back
              </Button>
              <h3 className="font-display font-bold text-xl text-gray-100">Create Routine</h3>
            </div>

            <div className="space-y-4">
              <Card hover={false} className="p-4 space-y-4 bg-gray-800/30">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Routine Name</label>
                  <Input
                    value={customPlan.name}
                    onChange={(e) => setCustomPlan(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Push Day, Upper Body A"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    className="font-display font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <Input
                    value={customPlan.desc}
                    onChange={(e) => setCustomPlan(p => ({ ...p, desc: e.target.value }))}
                    placeholder="Brief description of this workout"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exercises</label>
                  <span className="text-xs text-gray-500">{customPlan.exercises.length} exercises</span>
                </div>
                
                <div className="space-y-3">
                  {customPlan.exercises.map((ex, i) => (
                    <div key={i} className="group relative p-4 bg-gray-800/40 border border-gray-700/50 rounded-2xl space-y-3 hover:border-gray-600 transition-colors">
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
                            autoComplete="off"
                            autoCorrect="off"
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
                                autoComplete="off"
                                className="bg-gray-900/50 border-transparent focus:bg-gray-900"
                              />
                            </div>
                          </div>
                          
                          <Input
                            value={ex.tip}
                            onChange={(e) => updateExercise(i, 'tip', e.target.value)}
                            placeholder="Add a form tip (optional)"
                            autoComplete="off"
                            autoCorrect="off"
                            icon={Info}
                            className="text-sm bg-gray-900/50 border-transparent focus:bg-gray-900"
                          />
                        </div>
                        
                        <button
                          onClick={() => removeExercise(i)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove exercise"
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
              <Button onClick={handleSaveCustomPlan} className="w-full shadow-lg shadow-emerald-500/20" size="lg">
                Save Routine
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AddPlanModal;
