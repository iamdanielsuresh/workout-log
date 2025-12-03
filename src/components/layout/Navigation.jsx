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
    <nav className="fixed bottom-6 left-4 right-4 z-[100] max-w-lg mx-auto">
      {/* Navigation bar */}
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        <div className="px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map(({ id, icon: Icon, label }) => {
              const isActive = currentView === id || 
                (currentView === 'welcome' && id === 'home');
              
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex flex-col items-center gap-1 py-2 px-4 transition-all rounded-xl ${
                    isActive 
                      ? 'text-emerald-400 bg-white/5' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className={`relative p-1 transition-all`}>
                    <Icon className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`} />
                  </div>
                  <span className={`text-[10px] font-medium transition-all ${
                    isActive ? 'text-emerald-400' : ''
                  }`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
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
