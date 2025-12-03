import { useState } from 'react';
import { 
  Sparkles, Dumbbell, Clock, Play, Plus, X, 
  ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';

/**
 * Quick Plan Generator - Single-Day AI Workout Plan
 * Task 5: Generate a single-day workout from free-text prompt
 */
export function QuickPlanGenerator({ 
  isOpen, 
  onClose, 
  apiKey, 
  onLogWorkout, 
  onSaveAsTemplate,
  profile,
  onToast
}) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [error, setError] = useState(null);

  const EXAMPLE_PROMPTS = [
    "Quick 20-minute upper body",
    "Full body HIIT workout",
    "Leg day with focus on glutes",
    "No equipment home workout",
    "Push workout with dumbbells only"
  ];

  const generatePlan = async () => {
    if (!prompt.trim() || !apiKey) return;

    setGenerating(true);
    setError(null);
    setGeneratedPlan(null);

    const systemPrompt = `You are an expert fitness coach. Generate a single-day workout plan based on the user's request.

User Request: "${prompt}"
${profile?.experience_level ? `Experience Level: ${profile.experience_level}` : ''}
${profile?.injuries ? `Injuries/Limitations: ${profile.injuries}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "name": "Workout Name",
  "description": "Brief description of the workout",
  "estimatedTime": "25 min",
  "difficulty": "intermediate",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": "8-12",
      "rest": "60s",
      "muscleGroup": "Primary Muscle",
      "notes": "Quick form tip"
    }
  ],
  "warmup": "Brief warmup suggestion",
  "cooldown": "Brief cooldown suggestion"
}

Guidelines:
- Include 4-6 exercises appropriate for the request
- Provide realistic time estimates
- Include rest periods between sets
- Make exercises progressively harder
- Match difficulty to user's experience level if provided`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate workout plan');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from AI');
      }

      // Clean and parse JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const plan = JSON.parse(cleanedText);
      
      setGeneratedPlan(plan);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate workout plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLogAsToday = () => {
    if (!generatedPlan) return;
    
    // Convert to workout format and log
    const workoutData = {
      workoutType: 'quick-plan',
      workoutName: generatedPlan.name,
      exercises: generatedPlan.exercises.map(ex => ({
        name: ex.name,
        sets: Array(ex.sets).fill(null).map((_, i) => ({
          weight: 0,
          reps: parseInt(ex.reps?.split('-')[0]) || 10
        }))
      })),
      note: generatedPlan.description,
      duration: parseInt(generatedPlan.estimatedTime) * 60 || 0
    };
    
    if (onLogWorkout) {
      onLogWorkout(workoutData);
    }
    
    if (onToast) {
      onToast({ message: 'Workout logged!', type: 'success' });
    }
    
    handleClose();
  };

  const handleSaveAsTemplate = () => {
    if (!generatedPlan) return;
    
    // Convert to template format
    const templateData = {
      id: `quick-${Date.now()}`,
      name: generatedPlan.name,
      desc: generatedPlan.description,
      estTime: generatedPlan.estimatedTime,
      exercises: generatedPlan.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        range: ex.reps,
        tip: ex.notes,
        muscleGroup: ex.muscleGroup
      })),
      source: 'ai-generated'
    };
    
    if (onSaveAsTemplate) {
      onSaveAsTemplate(templateData);
    }
    
    if (onToast) {
      onToast({ message: 'Saved to routines!', type: 'success' });
    }
    
    handleClose();
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedPlan(null);
    setError(null);
    setExpandedExercise(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Quick Workout Generator">
      <div className="space-y-4">
        {!generatedPlan ? (
          <>
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Describe your workout
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Quick 20-minute upper body workout with dumbbells"
                rows={3}
              />
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Try these:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generatePlan}
              disabled={!prompt.trim() || generating}
              loading={generating}
              className="w-full"
              icon={Sparkles}
            >
              {generating ? 'Generating...' : 'Generate Workout'}
            </Button>
          </>
        ) : (
          <>
            {/* Generated Plan Display */}
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">{generatedPlan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{generatedPlan.description}</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {generatedPlan.estimatedTime}
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full capitalize">
                    {generatedPlan.difficulty}
                  </span>
                </div>
              </div>

              {/* Warmup */}
              {generatedPlan.warmup && (
                <Card hover={false} className="p-3 bg-amber-500/5 border-amber-500/20">
                  <p className="text-xs text-amber-400 font-medium mb-1">Warmup</p>
                  <p className="text-sm text-gray-300">{generatedPlan.warmup}</p>
                </Card>
              )}

              {/* Exercises */}
              <div className="space-y-2">
                {generatedPlan.exercises?.map((ex, i) => (
                  <Card 
                    key={i} 
                    hover={false} 
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-200">{ex.name}</p>
                        <p className="text-xs text-gray-500">
                          {ex.sets} sets × {ex.reps} • Rest {ex.rest}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                        {ex.muscleGroup}
                      </span>
                    </div>
                    {expandedExercise === i && ex.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        <p className="text-xs text-emerald-400">{ex.notes}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Cooldown */}
              {generatedPlan.cooldown && (
                <Card hover={false} className="p-3 bg-blue-500/5 border-blue-500/20">
                  <p className="text-xs text-blue-400 font-medium mb-1">Cooldown</p>
                  <p className="text-sm text-gray-300">{generatedPlan.cooldown}</p>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  icon={Plus}
                  onClick={handleSaveAsTemplate}
                >
                  Save to Routines
                </Button>
                <Button
                  className="flex-1"
                  icon={Play}
                  onClick={handleLogAsToday}
                >
                  Log as Today
                </Button>
              </div>

              {/* Regenerate */}
              <button
                onClick={() => setGeneratedPlan(null)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Generate a different workout
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default QuickPlanGenerator;
