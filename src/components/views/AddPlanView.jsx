import { useState, useMemo, useCallback } from 'react';
import { 
  X, Sparkles, ListChecks, ChevronRight, ChevronLeft, 
  Dumbbell, Key, Loader2, Check, Plus, Trash2, Zap, Clock, Target,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ViewHeader } from '../layout/Navigation';
import { WORKOUT_TEMPLATES } from '../onboarding/RoutineCreation';
import { 
  generateWorkoutPlan, 
  calculatePlanIntensity,
  getFocusRecommendations 
} from '../../utils/aiWorkoutGenerator';
import { findAlternativeExercise } from '../../services/ai';
import { buildUserContextForAI } from '../../utils/aiContext';
import { checkAiAvailability } from '../../utils/aiConfig';
import { AiPreferencesForm } from '../plans/AiPreferencesForm';

/**
 * AddPlanView - Add new workout plan/routine (Full Page)
 * Can choose from templates, AI generate, or create custom
 */
export function AddPlanView({ 
  onBack, 
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
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [aiStep, setAiStep] = useState('questions'); // 'questions' | 'generating' | 'preview'
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');
  
  const LOADING_STAGES = [
    { text: 'Analyzing your profile & goals...', duration: 2000 },
    { text: 'Designing your optimal split...', duration: 2500 },
    { text: 'Selecting the best exercises...', duration: 2000 },
    { text: 'Finalizing sets, reps & tips...', duration: 1500 }
  ];

  useEffect(() => {
    if (aiStep !== 'generating') return;
    
    setLoadingStage(0);
    let timeoutId;
    
    const runStage = (index) => {
      if (index >= LOADING_STAGES.length - 1) return;
      
      timeoutId = setTimeout(() => {
        setLoadingStage(index + 1);
        runStage(index + 1);
      }, LOADING_STAGES[index].duration);
    };

    runStage(0);
    
    return () => clearTimeout(timeoutId);
  }, [aiStep]);
  
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

  const toggleDayExpanded = (dayId) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const toggleExerciseExpanded = (exerciseKey) => {
    setExpandedExercises(prev => ({ ...prev, [exerciseKey]: !prev[exerciseKey] }));
  };

  const handleFindAlternative = async (dayId, exerciseIndex, exercise) => {
    const loadingKey = `${dayId}-${exerciseIndex}`;
    setLoadingAlternative(loadingKey);
    const key = effectiveApiKey;

    try {
      const alternative = await findAlternativeExercise(
        key, 
        exercise, 
        experienceLevel, 
        aiQuestions.equipment, 
        aiQuestions.specialNotes
      );

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
  };

  const handleGeneratePlan = async () => {
    if (!aiAvailable) {
      setError('Please enter a valid API key to generate AI workouts');
      return;
    }
    
    const key = effectiveApiKey;

    setAiStep('generating');
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
      setAiStep('preview');
      
      // Show warning if there was one
      if (result.warning) {
        console.warn('Generation warning:', result.warning);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
      setAiStep('questions');
    }
  };

  const handleAcceptGeneratedPlan = () => {
    onSave({
      type: 'ai-generated',
      plans: generatedPlan.plans,
      apiKey: localApiKey || apiKey
    });
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
    <div className="min-h-screen bg-gray-950 pb-24 animate-in fade-in duration-300">
      <ViewHeader 
        title={
          mode === 'templates' ? 'Choose Template' :
          mode === 'ai' ? 'AI Generator' :
          mode === 'custom' ? 'Create Routine' :
          'Add New Routine'
        }
        onBack={mode ? () => setMode(null) : onBack}
      />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
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
                  <h3 className="font-display font-bold text-lg text-gray-100 group-hover:text-emerald-400 transition-colors">Choose Template</h3>
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
                  <h3 className="font-display font-bold text-lg text-gray-100 group-hover:text-purple-400 transition-colors">AI Generate</h3>
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
                  <h3 className="font-display font-bold text-lg text-gray-100 group-hover:text-blue-400 transition-colors">Create Custom</h3>
                  <p className="text-sm text-gray-500">Build your own routine from scratch</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* Templates Selection */}
        {mode === 'templates' && (
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
                    <h3 className="font-display font-bold text-lg text-gray-100">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    <span className="text-xs text-emerald-400 font-medium">{template.frequency}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* AI Generation */}
        {mode === 'ai' && (
          <div className="space-y-5">
            {/* Step 1: Questions */}
            {aiStep === 'questions' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                <AiPreferencesForm 
                  questions={aiQuestions} 
                  setQuestions={setAiQuestions} 
                />

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </p>
                )}

                {/* Generate Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleGeneratePlan}
                    className="w-full shadow-lg shadow-purple-500/20"
                    size="lg"
                    icon={Sparkles}
                  >
                    Generate Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Loading */}
            {aiStep === 'generating' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                  <div className="relative w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-2xl">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  </div>
                </div>
                
                <div className="space-y-2 max-w-xs mx-auto">
                  <h3 className="text-xl font-display font-bold text-gray-100">
                    Creating Your Plan
                  </h3>
                  <div className="h-6 overflow-hidden relative">
                    {LOADING_STAGES.map((stage, i) => (
                      <p
                        key={i}
                        className={`absolute inset-0 w-full text-sm text-gray-400 transition-all duration-500 transform ${
                          i === loadingStage 
                            ? 'translate-y-0 opacity-100' 
                            : i < loadingStage 
                              ? '-translate-y-full opacity-0' 
                              : 'translate-y-full opacity-0'
                        }`}
                      >
                        {stage.text}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2">
                  {LOADING_STAGES.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        i === loadingStage ? 'bg-purple-500 scale-125' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {aiStep === 'preview' && generatedPlan && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-emerald-500/10">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-100">
                    {generatedPlan.programName || 'Plan Ready!'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
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
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg h-fit">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-purple-300 capitalize mb-1">{aiQuestions.focus} Focus</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {getFocusRecommendations(aiQuestions.focus).description}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {Object.entries(generatedPlan.plans).map(([dayId, plan]) => {
                    const isDayExpanded = expandedDays[dayId];
                    
                    return (
                      <div key={dayId} className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-600">
                        {/* Day Header - Clickable */}
                        <button
                          onClick={() => toggleDayExpanded(dayId)}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-display font-bold text-gray-100 text-lg">{plan.name}</h4>
                              {plan.intensity && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  plan.intensity.level === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                                  plan.intensity.level === 'Moderate' ? 'bg-emerald-500/20 text-emerald-400' :
                                  plan.intensity.level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {plan.intensity.level}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Dumbbell className="w-3.5 h-3.5" />
                                {plan.exercises?.length} exercises
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {plan.estTime}
                              </span>
                            </div>
                          </div>
                          <div className={`p-2 rounded-full bg-gray-800 transition-transform duration-300 ${isDayExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>

                        {/* Expanded Day Content */}
                        {isDayExpanded && (
                          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {plan.desc && (
                              <p className="text-sm text-gray-400 italic border-l-2 border-gray-700 pl-3 py-1">
                                {plan.desc}
                              </p>
                            )}
                            {plan.dayTip && (
                              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-purple-300 leading-relaxed">{plan.dayTip}</p>
                              </div>
                            )}
                            
                            <div className="space-y-2 mt-2">
                              {plan.exercises?.map((ex, exIdx) => {
                                const exerciseKey = `${dayId}-${exIdx}`;
                                const isExerciseExpanded = expandedExercises[exerciseKey];
                                const isLoadingAlt = loadingAlternative === exerciseKey;
                                
                                return (
                                  <div 
                                    key={exIdx} 
                                    className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800"
                                  >
                                    {/* Exercise Row - Clickable */}
                                    <button
                                      onClick={() => toggleExerciseExpanded(exerciseKey)}
                                      className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-200 font-medium text-sm">{ex.name}</span>
                                          {ex.replacedFrom && (
                                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                              swapped
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            {ex.sets} × {ex.range}
                                          </span>
                                          {ex.muscleGroup && (
                                            <span className="text-xs text-gray-600">{ex.muscleGroup}</span>
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
                                      <div className="px-3 pb-3 space-y-3 bg-gray-900/80 border-t border-gray-800 pt-3">
                                        {/* Form Tip */}
                                        {(ex.tip || ex.tips?.form) && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Form Cue</p>
                                            <p className="text-xs text-gray-300 leading-relaxed">{ex.tips?.form || ex.tip}</p>
                                          </div>
                                        )}

                                        {/* Cues */}
                                        {ex.tips?.cues?.length > 0 && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Key Points</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {ex.tips.cues.map((cue, i) => (
                                                <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700">
                                                  {cue}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Common Mistakes */}
                                        {ex.tips?.mistakes?.length > 0 && (
                                          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Avoid Mistakes</p>
                                            <ul className="space-y-1">
                                              {ex.tips.mistakes.map((m, i) => (
                                                <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                                                  <span className="text-red-500/50 mt-0.5">•</span>
                                                  {m}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Goal */}
                                        {ex.tips?.goal && (
                                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Target Goal</p>
                                            <p className="text-xs text-gray-300">{ex.tips.goal}</p>
                                          </div>
                                        )}

                                        {/* Replaced Info */}
                                        {ex.replacedFrom && ex.reason && (
                                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
                                            <p className="text-xs text-purple-300">
                                              <span className="font-bold">Why swapped:</span> {ex.reason}
                                            </p>
                                          </div>
                                        )}

                                        {/* Find Alternative Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFindAlternative(dayId, exIdx, ex);
                                          }}
                                          disabled={isLoadingAlt}
                                          className="w-full mt-2 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-gray-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                        >
                                          {isLoadingAlt ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              Finding alternative...
                                            </>
                                          ) : (
                                            <>
                                              <RefreshCw className="w-3.5 h-3.5" />
                                              Find Alternative Exercise
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Weekly volume summary */}
                {generatedPlan.weeklyVolume && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Estimated Weekly Volume: <span className="text-gray-300">{generatedPlan.weeklyVolume}</span>
                  </p>
                )}

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-gradient-to-t from-gray-950 via-gray-900 to-transparent pb-6 z-10">
                  <Button 
                    variant="secondary" 
                    onClick={() => setGeneratedPlan(null) || setAiStep('questions')} 
                    className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700"
                    icon={RefreshCw}
                  >
                    Regenerate
                  </Button>
                  <Button 
                    onClick={handleAcceptGeneratedPlan} 
                    className="flex-1 shadow-lg shadow-emerald-500/20"
                    icon={Check}
                  >
                    Save Routine
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Custom Plan Builder */}
        {mode === 'custom' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
    </div>
  );
}

export default AddPlanView;
