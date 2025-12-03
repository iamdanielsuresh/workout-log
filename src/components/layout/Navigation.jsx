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
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Hide navigation during active workout
  if (workoutActive) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%'
      }}
    >
      {/* Gradient fade for content underneath */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 safe-area-bottom">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around">
            {navItems.map(({ id, icon: Icon, label }) => {
              const isActive = currentView === id || 
                (currentView === 'welcome' && id === 'home');
              
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${
                    isActive 
                      ? 'text-emerald-400' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className={`relative p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-emerald-500/10' : ''
                  }`}>
                    <Icon className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
                    )}
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
              <h1 className="text-xl font-bold text-gray-100">{title}</h1>
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
