import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Dumbbell, Calendar, Share2, Check, Sparkles, Star, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function WorkoutCompleteModal({ 
  isOpen, 
  workoutName, 
  duration, 
  exercisesCount, 
  analysis,
  onClose 
}) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <Card className="p-8 text-center border-emerald-500/30 shadow-2xl shadow-emerald-500/20 select-none">
          {/* Trophy Icon */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Trophy className="w-10 h-10 text-gray-950" />
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
            Workout Crushed!
          </h2>
          <p className="text-gray-400 mb-8">
            Great job completing <span className="text-emerald-400 font-semibold">{workoutName}</span>
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
              <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-white">
                {formatDuration(duration)}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
              <Dumbbell className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-white">
                {exercisesCount}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Exercises</p>
            </div>
          </div>

          {/* AI Analysis */}
          {analysis && (analysis.summary || analysis.highlight || analysis.tip) && (
            <div className="mb-8 text-left bg-gray-900/50 rounded-2xl p-4 border border-gray-800 space-y-3 animate-in fade-in slide-in-from-bottom-2 delay-300">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wide">AI Analysis</span>
                </div>
                {analysis.rating && (
                  <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">{analysis.rating}/10</span>
                  </div>
                )}
              </div>
              
              {analysis.summary && (
                <p className="text-sm text-gray-300 leading-relaxed">
                  {analysis.summary}
                </p>
              )}

              {analysis.highlight && (
                <div className="flex items-start gap-2 text-xs bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                  <Zap className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-blue-200">{analysis.highlight}</span>
                </div>
              )}

              {analysis.tip && (
                <div className="flex items-start gap-2 text-xs bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                  <Dumbbell className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-purple-200">{analysis.tip}</span>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={onClose} 
            size="lg" 
            className="w-full font-bold"
            icon={Check}
          >
            Continue
          </Button>
        </Card>
      </div>
    </div>
  );
}
