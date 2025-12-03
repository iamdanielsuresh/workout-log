import { Home, History, Dumbbell, Settings, User, Sparkles } from 'lucide-react';

/**
 * BottomNavigation - Main app navigation bar
 * Fixed at the bottom of the screen, mobile-first design
 */
export function BottomNavigation({ 
  currentView, 
  onNavigate, 
  workoutActive = false,
  aiEnabled = false
}) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: History, label: 'History' },
    // Show Buddy tab only when AI is enabled
    ...(aiEnabled ? [{ id: 'buddy', icon: Sparkles, label: 'Buddy' }] : []),
    { id: 'plans', icon: Dumbbell, label: 'Plans' },
  ];

  // Hide navigation during active workout
  if (workoutActive) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-gray-950/80 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentView === id || 
              (currentView === 'welcome' && id === 'home');
            
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`group flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] rounded-xl transition-all duration-300 ease-out ${
                  isActive 
                    ? 'text-emerald-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className={`relative p-1 transition-all duration-300 ease-out ${
                  isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'
                }`}>
                  <Icon className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-2'
                  }`} />
                  
                  {/* Active Indicator Dot */}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                </div>
                
                <span className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive ? 'text-emerald-400 translate-y-0' : 'text-gray-600 translate-y-0.5'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * ViewHeader - Consistent header component for all views
 */
export function ViewHeader({ 
  title, 
  subtitle, 
  leftAction, 
  rightAction,
  className = ''
}) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl bg-gray-950/90 border-b border-gray-800 safe-area-top ${className}`}>
      <div className="px-6 py-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {leftAction}
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-100 tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {rightAction}
        </div>
      </div>
    </header>
  );
}
