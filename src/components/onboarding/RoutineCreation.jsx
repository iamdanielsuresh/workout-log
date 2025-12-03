import { useState } from 'react';
import { 
  Sparkles, ListChecks, ChevronRight, ChevronLeft, Check, 
  Dumbbell, Key, X, Loader2, Calendar, Target, ArrowRight,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle, Info
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Pre-built workout templates
export const WORKOUT_TEMPLATES = {
  ppl: {
    id: 'ppl',
    name: 'Push/Pull/Legs',
    description: '6-day split for muscle building',
    frequency: '6 days/week',
    focus: 'Hypertrophy',
    icon: '💪',
    plans: {
      push: {
        id: 'push',
        name: 'Push (Chest/Delt/Tri)',
        next: 'pull',
        estTime: '45 min',
        desc: 'Upper body pushing strength & hypertrophy.',
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 3, range: '8-12', tip: 'Set bench to 30°. Pause at bottom.' },
          { name: 'Flat Dumbbell Press', sets: 3, range: '8-12', tip: 'Retract scapula. Drive with elbows.' },
          { name: 'Cable Lateral Raise', sets: 3, range: '12-15', tip: 'Lead with elbow, not hand.' },
          { name: 'Overhead Tricep Ext.', sets: 3, range: '10-15', tip: 'Stretch is key. Keep elbows high.' },
          { name: 'Tricep Pushdown', sets: 2, range: '12-15', tip: 'Elbows glued to sides.' }
        ]
      },
      pull: {
        id: 'pull',
        name: 'Pull (Back/Bi)',
        next: 'legs',
        estTime: '50 min',
        desc: 'Back width, thickness, and arm size.',
        exercises: [
          { name: 'Lat Pulldown', sets: 3, range: '8-12', tip: 'Drive elbows to hips.' },
          { name: 'Chest-Supported Row', sets: 3, range: '8-12', tip: 'Squeeze back, don\'t pull with arms.' },
          { name: 'Face Pulls', sets: 3, range: '15-20', tip: 'External rotation at top.' },
          { name: 'Incline Dumbbell Curl', sets: 3, range: '10-12', tip: 'Full hang stretch.' },
          { name: 'Hammer Curls', sets: 2, range: '10-12', tip: 'Cross-body for brachialis.' }
        ]
      },
      legs: {
        id: 'legs',
        name: 'Legs + Abs',
        next: 'push',
        estTime: '55 min',
        desc: 'Lower body power and core stability.',
        exercises: [
          { name: 'Squat/Leg Press', sets: 4, range: '8-12', tip: 'Break parallel. Knees track toes.' },
          { name: 'Romanian Deadlift', sets: 3, range: '8-12', tip: 'Hips back. Feel hamstring stretch.' },
          { name: 'Leg Extension', sets: 3, range: '12-15', tip: 'Pause at top.' },
          { name: 'Leg Curl', sets: 3, range: '12-15', tip: 'Control the negative.' },
          { name: 'Calf Raises', sets: 4, range: '12-20', tip: 'Full stretch at bottom.' },
          { name: 'Weighted Crunch', sets: 3, range: '15-20', tip: 'Curl chest to knees.' }
        ]
      }
    }
  },
  upperLower: {
    id: 'upperLower',
    name: 'Upper/Lower',
    description: '4-day split, balanced approach',
    frequency: '4 days/week',
    focus: 'Strength + Hypertrophy',
    icon: '🏋️',
    plans: {
      upper: {
        id: 'upper',
        name: 'Upper Body',
        next: 'lower',
        estTime: '50 min',
        desc: 'Complete upper body development.',
        exercises: [
          { name: 'Bench Press', sets: 4, range: '6-10', tip: 'Arch back, retract scapula.' },
          { name: 'Barbell Row', sets: 4, range: '8-12', tip: 'Drive elbows back.' },
          { name: 'Overhead Press', sets: 3, range: '8-12', tip: 'Brace core tight.' },
          { name: 'Lat Pulldown', sets: 3, range: '10-12', tip: 'Feel the lats stretch.' },
          { name: 'Dumbbell Curl', sets: 2, range: '10-15', tip: 'No swinging.' },
          { name: 'Tricep Pushdown', sets: 2, range: '10-15', tip: 'Lock elbows in place.' }
        ]
      },
      lower: {
        id: 'lower',
        name: 'Lower Body',
        next: 'upper',
        estTime: '50 min',
        desc: 'Legs and posterior chain focus.',
        exercises: [
          { name: 'Squat', sets: 4, range: '6-10', tip: 'Break parallel.' },
          { name: 'Romanian Deadlift', sets: 3, range: '8-12', tip: 'Hinge at hips.' },
          { name: 'Leg Press', sets: 3, range: '10-15', tip: 'Full range of motion.' },
          { name: 'Leg Curl', sets: 3, range: '12-15', tip: 'Squeeze hamstrings.' },
          { name: 'Calf Raises', sets: 4, range: '15-20', tip: 'Pause at top.' },
          { name: 'Plank', sets: 3, range: '45-60s', tip: 'Keep hips level.' }
        ]
      }
    }
  },
  fullBody: {
    id: 'fullBody',
    name: 'Full Body',
    description: '3-day efficient training',
    frequency: '3 days/week',
    focus: 'Efficiency',
    icon: '⚡',
    plans: {
      fullBodyA: {
        id: 'fullBodyA',
        name: 'Full Body A',
        next: 'fullBodyB',
        estTime: '45 min',
        desc: 'Compound-focused full body.',
        exercises: [
          { name: 'Squat', sets: 3, range: '8-12', tip: 'Depth is key.' },
          { name: 'Bench Press', sets: 3, range: '8-12', tip: 'Control the bar.' },
          { name: 'Barbell Row', sets: 3, range: '8-12', tip: 'Pull to lower chest.' },
          { name: 'Overhead Press', sets: 2, range: '10-12', tip: 'Straight bar path.' },
          { name: 'Bicep Curl', sets: 2, range: '12-15', tip: 'Squeeze at top.' }
        ]
      },
      fullBodyB: {
        id: 'fullBodyB',
        name: 'Full Body B',
        next: 'fullBodyA',
        estTime: '45 min',
        desc: 'Variation day.',
        exercises: [
          { name: 'Deadlift', sets: 3, range: '6-8', tip: 'Drive through heels.' },
          { name: 'Incline Press', sets: 3, range: '8-12', tip: 'Upper chest focus.' },
          { name: 'Lat Pulldown', sets: 3, range: '10-12', tip: 'Wide grip.' },
          { name: 'Lunges', sets: 2, range: '10-12 each', tip: 'Keep torso upright.' },
          { name: 'Tricep Dips', sets: 2, range: '12-15', tip: 'Lean slightly forward.' }
        ]
      }
    }
  },
  bro: {
    id: 'bro',
    name: 'Bro Split',
    description: 'Classic 5-day bodybuilding',
    frequency: '5 days/week',
    focus: 'Bodybuilding',
    icon: '🔥',
    plans: {
      chest: {
        id: 'chest',
        name: 'Chest Day',
        next: 'back',
        estTime: '45 min',
        desc: 'Chest development.',
        exercises: [
          { name: 'Flat Bench Press', sets: 4, range: '8-12', tip: 'Touch chest each rep.' },
          { name: 'Incline Dumbbell Press', sets: 3, range: '10-12', tip: '30° angle.' },
          { name: 'Cable Flyes', sets: 3, range: '12-15', tip: 'Squeeze at middle.' },
          { name: 'Dips', sets: 3, range: '10-15', tip: 'Lean forward for chest.' }
        ]
      },
      back: {
        id: 'back',
        name: 'Back Day',
        next: 'shoulders',
        estTime: '50 min',
        desc: 'Back width and thickness.',
        exercises: [
          { name: 'Deadlift', sets: 3, range: '5-8', tip: 'Keep bar close.' },
          { name: 'Pull-ups', sets: 4, range: '8-12', tip: 'Full hang each rep.' },
          { name: 'Barbell Row', sets: 3, range: '8-12', tip: 'Squeeze shoulder blades.' },
          { name: 'Seated Cable Row', sets: 3, range: '10-12', tip: 'Pull to belly button.' }
        ]
      },
      shoulders: {
        id: 'shoulders',
        name: 'Shoulder Day',
        next: 'arms',
        estTime: '40 min',
        desc: 'Boulder shoulders.',
        exercises: [
          { name: 'Overhead Press', sets: 4, range: '8-12', tip: 'Brace core.' },
          { name: 'Lateral Raises', sets: 4, range: '12-15', tip: 'Lead with elbows.' },
          { name: 'Face Pulls', sets: 3, range: '15-20', tip: 'Rear delts focus.' },
          { name: 'Front Raises', sets: 2, range: '12-15', tip: 'Alternate arms.' }
        ]
      },
      arms: {
        id: 'arms',
        name: 'Arms Day',
        next: 'legs',
        estTime: '40 min',
        desc: 'Biceps and triceps.',
        exercises: [
          { name: 'Barbell Curl', sets: 3, range: '10-12', tip: 'No body swing.' },
          { name: 'Skull Crushers', sets: 3, range: '10-12', tip: 'Elbows stay fixed.' },
          { name: 'Hammer Curls', sets: 3, range: '10-12', tip: 'Controlled tempo.' },
          { name: 'Rope Pushdown', sets: 3, range: '12-15', tip: 'Spread rope at bottom.' },
          { name: 'Preacher Curl', sets: 2, range: '12-15', tip: 'Full stretch.' }
        ]
      },
      legs: {
        id: 'legs',
        name: 'Leg Day',
        next: 'chest',
        estTime: '55 min',
        desc: 'Complete leg development.',
        exercises: [
          { name: 'Squat', sets: 4, range: '8-12', tip: 'Ass to grass.' },
          { name: 'Leg Press', sets: 3, range: '12-15', tip: 'Full range.' },
          { name: 'Romanian Deadlift', sets: 3, range: '10-12', tip: 'Hamstring focus.' },
          { name: 'Leg Extension', sets: 3, range: '12-15', tip: 'Peak contraction.' },
          { name: 'Leg Curl', sets: 3, range: '12-15', tip: 'Control negative.' },
          { name: 'Calf Raises', sets: 4, range: '15-20', tip: 'Full stretch.' }
        ]
      }
    }
  }
};

/**
 * Routine Creation - Step 2 of onboarding flow
 * Choose between templates or AI-generated workout
 */
export function RoutineCreation({ onComplete, onBack, experienceLevel, apiKey: existingApiKey }) {
  const [mode, setMode] = useState(null); // 'templates' | 'ai'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(existingApiKey || '');
  const [aiStep, setAiStep] = useState('questions'); // 'questions' | 'generating' | 'preview'
  const [aiQuestions, setAiQuestions] = useState({
    daysPerWeek: 4,
    focus: 'balanced',
    duration: '45-60',
    equipment: 'full',
    specialNotes: ''
  });
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [loadingAlternative, setLoadingAlternative] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleDayExpanded = (dayId) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const toggleExerciseExpanded = (exerciseKey) => {
    setExpandedExercises(prev => ({ ...prev, [exerciseKey]: !prev[exerciseKey] }));
  };

  const findAlternativeExercise = async (dayId, exerciseIndex, exercise) => {
    const loadingKey = `${dayId}-${exerciseIndex}`;
    setLoadingAlternative(loadingKey);

    try {
      const prompt = `Suggest ONE alternative exercise to replace "${exercise.name}" that targets the same muscle group (${exercise.muscleGroup || 'similar muscles'}).

Requirements:
- Equipment: ${aiQuestions.equipment === 'full' ? 'Full gym' : aiQuestions.equipment === 'dumbbells' ? 'Dumbbells only' : 'Bodyweight'}
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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
    onComplete({
      type: 'template',
      templateId,
      plans: template.plans,
      apiKey: mode === 'ai' ? apiKey : null
    });
  };

  const handleGeneratePlan = async () => {
    if (!apiKey || !apiKey.startsWith('AIza')) {
      setError('Please enter a valid API key');
      return;
    }

    setGenerating(true);
    setError('');
    setAiStep('generating');

    try {
      // Build special notes section if provided
      const specialNotesSection = aiQuestions.specialNotes.trim() 
        ? `\n\nUSER SPECIAL NOTES (IMPORTANT - must accommodate these):
${aiQuestions.specialNotes.trim()}`
        : '';

      const prompt = `Create a ${aiQuestions.daysPerWeek}-day workout plan for a ${experienceLevel} lifter.

Requirements:
- Focus: ${aiQuestions.focus} (balanced/upper body/lower body/strength/hypertrophy)
- Session duration: ${aiQuestions.duration} minutes
- Equipment: ${aiQuestions.equipment} (full gym/dumbbells only/bodyweight)${specialNotesSection}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "plans": {
    "day1": {
      "id": "day1",
      "name": "Day Name",
      "next": "day2",
      "estTime": "${aiQuestions.duration} min",
      "desc": "Brief description of the workout focus",
      "dayTip": "One motivational or strategic tip for this workout day",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "range": "8-12",
          "muscleGroup": "Primary muscle targeted",
          "tip": "Quick form tip (1 sentence)",
          "tips": {
            "form": "Detailed form instructions (2-3 sentences)",
            "cues": ["Quick cue 1", "Quick cue 2"],
            "mistakes": ["Common mistake 1", "Common mistake 2"],
            "goal": "What this exercise achieves",
            "progression": "How to progress when ready"
          }
        }
      ]
    }
  },
  "programTip": "Overall tip for success with this program"
}

Guidelines:
- Create exactly ${aiQuestions.daysPerWeek} days (day1, day2, etc). Last day's "next" points to "day1"
- 4-6 exercises per day appropriate for ${experienceLevel} level
- Start with compound movements, finish with isolation
- Make form tips specific and actionable
- Common mistakes should be what ${experienceLevel}s typically do wrong
- Goals should explain WHY each exercise is included
- Progression tips should be appropriate for ${experienceLevel} level
- IMPORTANT: If user mentioned injuries, limitations, or exercise preferences, strictly follow them`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Clean up the response - remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const plan = JSON.parse(cleanedText);
      
      setGeneratedPlan(plan);
      setAiStep('preview');
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate plan. Please check your API key and try again.');
      setAiStep('questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptGeneratedPlan = () => {
    onComplete({
      type: 'ai-generated',
      plans: generatedPlan.plans,
      programTip: generatedPlan.programTip,
      apiKey
    });
  };

  // Initial choice screen
  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Create Your Routine</h2>
          <p className="text-gray-500 text-sm">Choose how to set up your workout plan</p>
        </div>

        <div className="space-y-3">
          {/* Templates Option */}
          <button
            onClick={() => setMode('templates')}
            className="w-full p-5 rounded-2xl bg-gray-800/50 border-2 border-gray-700 hover:border-emerald-500/50 transition-all duration-300 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <ListChecks className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">
                  Choose a Template
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pick from proven workout splits like PPL, Upper/Lower, or Full Body
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </div>
          </button>

          {/* AI Option */}
          <button
            onClick={() => setMode('ai')}
            className="w-full p-5 rounded-2xl bg-gray-800/50 border-2 border-gray-700 hover:border-purple-500/50 transition-all duration-300 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-100 group-hover:text-purple-400 transition-colors">
                  AI Generate Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Let AI create a personalized plan based on your goals
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-purple-400/80 bg-purple-500/10 px-2 py-1 rounded-full">
                  <Key className="w-3 h-3" /> Requires API key
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </div>
          </button>
        </div>

        <Button variant="ghost" onClick={onBack} className="w-full" icon={ChevronLeft}>
          Back
        </Button>
      </div>
    );
  }

  // Templates selection
  if (mode === 'templates') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Choose a Template</h2>
          <p className="text-gray-500 text-sm">Select a workout split that fits your schedule</p>
        </div>

        <div className="space-y-3">
          {Object.values(WORKOUT_TEMPLATES).map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={`w-full p-4 rounded-2xl bg-gray-800/50 border-2 transition-all duration-300 text-left ${
                selectedTemplate === template.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-100">{template.name}</h3>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-400">
                      {template.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-emerald-400">{template.focus}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{Object.keys(template.plans).length} workouts</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>
          ))}
        </div>

        <Button variant="ghost" onClick={() => setMode(null)} className="w-full" icon={ChevronLeft}>
          Back
        </Button>
      </div>
    );
  }

  // AI flow
  if (mode === 'ai') {
    // API Key input
    if (!apiKey || showApiKeyInput) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Enter API Key</h2>
            <p className="text-gray-500 text-sm">Required for AI-powered features</p>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(''); }}
              placeholder="AIza..."
              icon={Key}
              error={error}
            />
            {error && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <X className="w-4 h-4" /> {error}
              </p>
            )}

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400 font-medium">Get your free API key:</p>
              <ol className="mt-2 text-sm text-gray-500 space-y-1">
                <li>1. Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">aistudio.google.com/apikey</a></li>
                <li>2. Click "Create API Key"</li>
                <li>3. Copy and paste it here</li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setShowApiKeyInput(false)} 
              disabled={!apiKey.startsWith('AIza')}
              className="w-full"
              icon={ChevronRight}
            >
              Continue
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)} className="w-full" icon={ChevronLeft}>
              Back
            </Button>
          </div>
        </div>
      );
    }

    // AI Questions
    if (aiStep === 'questions') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Customize Your Plan</h2>
            <p className="text-gray-500 text-sm">Answer a few questions</p>
          </div>

          <div className="space-y-4">
            {/* Days per week */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Days per week
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() => setAiQuestions(p => ({ ...p, daysPerWeek: days }))}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      aiQuestions.daysPerWeek === days
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Training focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'upper', label: 'Upper Body' },
                  { id: 'lower', label: 'Lower Body' },
                  { id: 'strength', label: 'Strength' },
                  { id: 'hypertrophy', label: 'Muscle Size' },
                  { id: 'athletic', label: 'Athletic' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAiQuestions(p => ({ ...p, focus: option.id }))}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      aiQuestions.focus === option.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                ⏱️ Session duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '30-45', label: '30-45 min' },
                  { id: '45-60', label: '45-60 min' },
                  { id: '60-90', label: '60-90 min' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAiQuestions(p => ({ ...p, duration: option.id }))}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      aiQuestions.duration === option.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <Dumbbell className="w-4 h-4 inline mr-2" />
                Available equipment
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'full', label: 'Full Gym', desc: 'Barbells, machines, cables' },
                  { id: 'dumbbells', label: 'Dumbbells Only', desc: 'Home gym basics' },
                  { id: 'bodyweight', label: 'Bodyweight', desc: 'No equipment' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAiQuestions(p => ({ ...p, equipment: option.id }))}
                    className={`py-3 px-4 rounded-xl text-left transition-all ${
                      aiQuestions.equipment === option.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs opacity-70 ml-2">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Notes / Limitations */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Anything AI should know?
              </label>
              <textarea
                value={aiQuestions.specialNotes}
                onChange={(e) => setAiQuestions(p => ({ ...p, specialNotes: e.target.value }))}
                placeholder="E.g., shoulder injury (avoid overhead pressing), don't like bench press, focus on back development, bad knees..."
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Injuries, exercise preferences, or specific goals
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <X className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleGeneratePlan}
              className="w-full bg-purple-500 hover:bg-purple-600"
              icon={Sparkles}
            >
              Generate My Plan
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)} className="w-full" icon={ChevronLeft}>
              Back
            </Button>
          </div>
        </div>
      );
    }

    // Generating
    if (aiStep === 'generating') {
      return (
        <div className="space-y-6 text-center py-12">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Creating Your Plan</h2>
            <p className="text-gray-500 text-sm">AI is designing the perfect routine for you...</p>
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      );
    }

    // Preview generated plan
    if (aiStep === 'preview' && generatedPlan) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Your Plan is Ready!</h2>
            <p className="text-gray-500 text-sm">Tap each day to expand • Tap exercises for details</p>
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1 justify-center">
              <X className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {Object.entries(generatedPlan.plans).map(([dayId, day], idx) => {
              const isDayExpanded = expandedDays[dayId];
              
              return (
                <Card key={dayId} hover={false} className="overflow-hidden">
                  {/* Day Header - Clickable */}
                  <button
                    onClick={() => toggleDayExpanded(dayId)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-100">{day.name}</h3>
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400">
                          {day.estTime}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{day.desc}</p>
                      {!isDayExpanded && (
                        <p className="text-xs text-gray-600 mt-1">
                          {day.exercises.length} exercises
                        </p>
                      )}
                    </div>
                    {isDayExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Expanded Day Content */}
                  {isDayExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {day.dayTip && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mb-3">
                          <p className="text-xs text-purple-300">💡 {day.dayTip}</p>
                        </div>
                      )}
                      
                      {day.exercises.map((ex, exIdx) => {
                        const exerciseKey = `${dayId}-${exIdx}`;
                        const isExerciseExpanded = expandedExercises[exerciseKey];
                        const isLoadingAlt = loadingAlternative === exerciseKey;
                        
                        return (
                          <div 
                            key={exIdx} 
                            className="bg-gray-800/50 rounded-xl overflow-hidden"
                          >
                            {/* Exercise Row - Clickable */}
                            <button
                              onClick={() => toggleExerciseExpanded(exerciseKey)}
                              className="w-full p-3 flex items-center justify-between text-left"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-200 font-medium text-sm">{ex.name}</span>
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
                              <div className="px-3 pb-3 space-y-2">
                                {/* Form Tip */}
                                {(ex.tip || ex.tips?.form) && (
                                  <div className="bg-gray-900/50 rounded-lg p-2">
                                    <p className="text-xs font-medium text-gray-400 mb-1">Form</p>
                                    <p className="text-xs text-gray-300">{ex.tips?.form || ex.tip}</p>
                                  </div>
                                )}

                                {/* Cues */}
                                {ex.tips?.cues?.length > 0 && (
                                  <div className="bg-gray-900/50 rounded-lg p-2">
                                    <p className="text-xs font-medium text-gray-400 mb-1">Cues</p>
                                    <div className="flex flex-wrap gap-1">
                                      {ex.tips.cues.map((cue, i) => (
                                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                                          {cue}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Common Mistakes */}
                                {ex.tips?.mistakes?.length > 0 && (
                                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2">
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
                                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2">
                                    <p className="text-xs font-medium text-emerald-400 mb-1">Goal</p>
                                    <p className="text-xs text-gray-300">{ex.tips.goal}</p>
                                  </div>
                                )}

                                {/* Replaced From Info */}
                                {ex.replacedFrom && ex.reason && (
                                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
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
                                  className="w-full mt-2 py-2 px-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                                >
                                  {isLoadingAlt ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Finding alternative...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-3 h-3" />
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
                  )}
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <Button onClick={handleAcceptGeneratedPlan} className="w-full" icon={Check}>
              Use This Plan
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setAiStep('questions')} 
              className="w-full"
              icon={ChevronLeft}
            >
              Regenerate
            </Button>
          </div>
        </div>
      );
    }
  }

  return null;
}
