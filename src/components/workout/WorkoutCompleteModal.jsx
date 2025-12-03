import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Dumbbell, Calendar, Share2, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function WorkoutCompleteModal({ 
  isOpen, 
  workoutName, 
  duration, 
  exercisesCount, 
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
        <Card className="p-8 text-center border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
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
