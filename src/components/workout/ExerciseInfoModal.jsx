import { useState } from 'react';
import { 
  X, Target, AlertTriangle, Lightbulb, TrendingUp, 
  Dumbbell, Clock, Sparkles, ChevronDown, ChevronUp,
  Info, CheckCircle2, XCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/**
 * ExerciseInfoModal - Detailed exercise information with AI-powered tips
 * Shows form cues, common mistakes, goals, and progression tips
 */
export function ExerciseInfoModal({ 
  isOpen, 
  onClose, 
  exercise,
  lastLog,
  aiEnabled = false,
  onGenerateTips
}) {
  const [expandedSection, setExpandedSection] = useState('form');
  const [aiTips, setAiTips] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);

  if (!exercise) return null;

  const handleGenerateAITips = async () => {
    if (!onGenerateTips) return;
    setLoadingTips(true);
    try {
      const tips = await onGenerateTips(exercise.name);
      setAiTips(tips);
    } catch (error) {
      console.error('Failed to generate tips:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Parse exercise tips if they're in extended format
  const tips = typeof exercise.tips === 'object' ? exercise.tips : {
    form: exercise.tip || 'Focus on controlled movements.',
    mistakes: exercise.mistakes || null,
    goal: exercise.goal || null,
    progression: exercise.progression || null
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">{exercise.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">
                  {exercise.sets} sets × {exercise.range}
                </span>
                {exercise.muscleGroup && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {exercise.muscleGroup}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Last Performance */}
        {lastLog && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Last Session</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lastLog.sets.map((set, i) => (
                <span key={i} className="text-sm bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                  Set {i + 1}: {set.weight}kg × {set.reps}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Info Sections */}
        <div className="space-y-3">
          {/* Form Tips */}
          <CollapsibleSection
            title="Form Tips"
            icon={Target}
            iconColor="text-emerald-400"
            bgColor="bg-emerald-500/10"
            isExpanded={expandedSection === 'form'}
            onToggle={() => toggleSection('form')}
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              {tips.form}
            </p>
            {tips.cues && (
              <ul className="mt-3 space-y-2">
                {(Array.isArray(tips.cues) ? tips.cues : [tips.cues]).map((cue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {cue}
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          {/* Common Mistakes */}
          {tips.mistakes && (
            <CollapsibleSection
              title="Common Mistakes"
              icon={AlertTriangle}
              iconColor="text-red-400"
              bgColor="bg-red-500/10"
              isExpanded={expandedSection === 'mistakes'}
              onToggle={() => toggleSection('mistakes')}
            >
              <ul className="space-y-2">
                {(Array.isArray(tips.mistakes) ? tips.mistakes : [tips.mistakes]).map((mistake, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Goal */}
          {tips.goal && (
            <CollapsibleSection
              title="Exercise Goal"
              icon={Lightbulb}
              iconColor="text-yellow-400"
              bgColor="bg-yellow-500/10"
              isExpanded={expandedSection === 'goal'}
              onToggle={() => toggleSection('goal')}
            >
              <p className="text-sm text-gray-300 leading-relaxed">
                {tips.goal}
              </p>
            </CollapsibleSection>
          )}

          {/* Progression Tips */}
          {tips.progression && (
            <CollapsibleSection
              title="Progression Tips"
              icon={TrendingUp}
              iconColor="text-blue-400"
              bgColor="bg-blue-500/10"
              isExpanded={expandedSection === 'progression'}
              onToggle={() => toggleSection('progression')}
            >
              <p className="text-sm text-gray-300 leading-relaxed">
                {tips.progression}
              </p>
            </CollapsibleSection>
          )}
        </div>

        {/* AI Tips Section */}
        {aiEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            {aiTips ? (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">AI Coach Tips</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{aiTips}</p>
              </div>
            ) : (
              <Button
                onClick={handleGenerateAITips}
                loading={loadingTips}
                variant="secondary"
                className="w-full"
                icon={Sparkles}
              >
                Get AI Coaching Tips
              </Button>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  bgColor, 
  isExpanded, 
  onToggle, 
  children 
}) {
  return (
    <div className={`rounded-xl border border-gray-800 overflow-hidden transition-all ${
      isExpanded ? bgColor : 'bg-gray-900/50'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default ExerciseInfoModal;
