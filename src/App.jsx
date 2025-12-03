import { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronRight, Save, History, Download, Clock, 
  Flame, Moon, Sun, StickyNote, LogOut, User, Check, 
  Timer, ChevronDown, ChevronUp, Zap, Play, RefreshCw, 
  Settings, Sparkles, Key, X, ExternalLink, RotateCcw, Trash2,
  AlertTriangle, UserX, ArrowLeft, Home, Edit3, WifiOff, Wifi
} from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import { useWorkouts } from './hooks/useWorkouts';
import { useTimer } from './hooks/useTimer';
import { useAI } from './hooks/useAI';
import { useProfile } from './hooks/useProfile';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Components
import { Card } from './components/ui/Card';
import { Button, IconButton } from './components/ui/Button';
import { Input, Textarea } from './components/ui/Input';
import { Toast } from './components/ui/Toast';
import { Modal, ConfirmDialog } from './components/ui/Modal';
import { RestTimer } from './components/workout/RestTimer';
import { ProgressBar } from './components/workout/ProgressBar';
import { ExerciseLogger } from './components/workout/ExerciseLogger';
import { WorkoutCard, StreakCard } from './components/workout/WorkoutCard';
import { WorkoutStartModal } from './components/workout/WorkoutStartModal';
import { OnboardingFlow } from './components/onboarding';
import { BottomNavigation, ViewHeader } from './components/layout/Navigation';
import { PlansView } from './components/views/PlansView';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { BuddyView } from './components/views/BuddyView';
import { AddPlanModal } from './components/plans/AddPlanModal';
import { EditPlanModal } from './components/plans/EditPlanModal';

// Constants & Services
import { DEFAULT_WORKOUT_PLANS } from './constants/defaults';
import { getExerciseTip, verifyApiKey } from './services/ai';
import { createLogger } from './utils/logger';
import { getRecommendedWorkout, getNextActionHint, getRecommendationReason } from './utils/workoutRecommendation';

const log = createLogger('App');

export default function App() {
  const { user, loading: authLoading, userName, userPhoto, isAnonymous, signInWithGoogle, signInAnonymously, signOut, deleteAccount } = useAuth();
  const { settings, saveSettings, aiEnabled, apiKey, onboardingCompleted, loading: settingsLoading } = useSettings(user?.id);
  const { profile, saveProfile, hasProfile, loading: profileLoading } = useProfile(user?.id);
  const { plans, savePlans, deletePlan, hasCustomPlans, loading: plansLoading } = useWorkoutPlans(user?.id);
  const { workouts, history, lastWorkout, streak, loading: workoutsLoading, saveWorkout, deleteWorkout } = useWorkouts(user?.id);
  const { isOnline, wasOffline } = useNetworkStatus();
  
  // Navigation state
  const [view, setView] = useState('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  
  // Active workout state
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [activeLog, setActiveLog] = useState({});
  const [workoutNote, setWorkoutNote] = useState('');
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  
  // AI tips state
  const [aiTips, setAiTips] = useState({});
  const [aiTipLoading, setAiTipLoading] = useState({});

  const { formatTime, reset: resetTimer } = useTimer(view === 'workout');

  // Determine if we need onboarding - only after all data is loaded
  const dataLoaded = user && !settingsLoading && !profileLoading && !plansLoading;
  const needsOnboarding = dataLoaded && (!hasProfile || !onboardingCompleted);

  // Debug logging
  useEffect(() => {
    if (user) {
      log.log('Data status:', {
        userId: user.id,
        dataLoaded,
        settingsLoading,
        profileLoading,
        plansLoading,
        hasProfile,
        onboardingCompleted,
        needsOnboarding
      });
    }
  }, [user, dataLoaded, settingsLoading, profileLoading, plansLoading, hasProfile, onboardingCompleted, needsOnboarding]);

  // Show/hide onboarding based on data
  useEffect(() => {
    if (dataLoaded) {
      if (needsOnboarding) {
        log.log('User needs onboarding, showing flow');
        setShowOnboarding(true);
      } else {
        log.log('User already onboarded, hiding flow');
        setShowOnboarding(false);
      }
    }
  }, [dataLoaded, needsOnboarding]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (data) => {
    log.log('Onboarding complete, saving data:', data);
    log.log('Current user ID:', user?.id);
    
    try {
      // Save profile
      if (data.profile) {
        log.log('Saving profile...');
        const savedProfile = await saveProfile({
          ...data.profile,
          experience_level: data.experienceLevel
        });
        log.log('Profile saved:', savedProfile);
      }

      // Save workout plans if provided
      if (data.workoutPlans) {
        log.log('Saving workout plans...');
        const savedPlans = await savePlans(data.workoutPlans, data.routineType || 'template', data.templateId);
        log.log('Plans saved:', savedPlans);
      }

      // Save settings
      log.log('Saving settings...');
      const savedSettings = await saveSettings({
        ai_enabled: data.aiEnabled || false,
        google_api_key: data.apiKey || null,
        onboarding_completed: true
      });
      log.log('Settings saved:', savedSettings);

      setShowOnboarding(false);
      setToast({ 
        message: data.aiEnabled ? 'All set! AI Workout Buddy enabled 🤖' : 'Welcome! Let\'s crush some workouts 💪', 
        type: 'success' 
      });
    } catch (error) {
      log.error('Error completing onboarding:', error);
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    }
  };

  // Navigation handler
  const handleNavigate = (newView) => {
    // If in workout, confirm before leaving
    if (view === 'workout' && Object.keys(activeLog).length > 0) {
      setConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setConfirmModal({ isOpen: false });
          setView(newView === 'home' ? 'home' : newView);
          setActiveWorkoutId(null);
        }
      });
    } else {
      setView(newView === 'home' ? 'home' : newView);
      if (newView !== 'workout') {
        setActiveWorkoutId(null);
      }
    }
  };

  // Handle workout selection (shows slide-to-start modal)
  const handleSelectWorkout = (workoutId) => {
    setSelectedWorkoutId(workoutId);
    setShowStartModal(true);
  };

  // Handle actual workout start (after slide confirmation)
  const handleStartWorkout = () => {
    setShowStartModal(false);
    setActiveWorkoutId(selectedWorkoutId);
    setActiveLog({});
    setWorkoutNote('');
    setAiTips({});
    setWorkoutStartTime(Date.now());
    resetTimer();
    setView('workout');
  };

  const handleBackFromWorkout = () => {
    if (Object.keys(activeLog).length > 0) {
      setConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setConfirmModal({ isOpen: false });
          setView('home');
          setActiveWorkoutId(null);
        }
      });
    } else {
      setView('home');
      setActiveWorkoutId(null);
    }
  };

  const handleFinishWorkout = async () => {
    const exercisesList = Object.values(activeLog);
    if (exercisesList.length === 0) {
      setToast({ message: 'Log at least one exercise!', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await saveWorkout({
        workoutType: activeWorkoutId,
        workoutName: plans[activeWorkoutId]?.name || activeWorkoutId,
        exercises: exercisesList,
        note: workoutNote,
        duration: Math.floor((Date.now() - workoutStartTime) / 1000)
      });
      setToast({ message: 'Workout saved! 💪', type: 'success' });
      setView('home');
      setActiveWorkoutId(null);
    } catch (error) {
      log.error('Error saving workout:', error);
      setToast({ message: 'Failed to save workout', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestTip = async (exerciseName) => {
    if (!aiEnabled || !apiKey) return;
    
    setAiTipLoading(prev => ({ ...prev, [exerciseName]: true }));
    try {
      const tip = await getExerciseTip(apiKey, exerciseName, history[exerciseName]?.sets?.[0]?.weight, profile?.display_name || userName);
      setAiTips(prev => ({ ...prev, [exerciseName]: tip }));
    } catch (error) {
      log.error('Error getting AI tip:', error);
    } finally {
      setAiTipLoading(prev => ({ ...prev, [exerciseName]: false }));
    }
  };

  // Loading state
  if (authLoading || (user && (settingsLoading || profileLoading || plansLoading))) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950">
        <div className="text-center animate-pulse">
          <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 p-6">
        <Card hover={false} className="p-8 max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <Dumbbell className="w-8 h-8 text-gray-950" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Workout Log</h1>
            <p className="text-gray-500 text-sm mt-2">Track your gains, crush your goals</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={signInWithGoogle}
              variant="secondary"
              className="w-full justify-center"
              icon={() => (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            >
              Sign in with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-3 text-gray-600 font-medium">or</span>
              </div>
            </div>

            <Button
              onClick={signInAnonymously}
              variant="ghost"
              className="w-full justify-center"
              icon={User}
            >
              Continue as Guest
            </Button>
          </div>

          <p className="text-xs text-gray-600 text-center mt-6">
            Sign in to sync your workouts across devices
          </p>
        </Card>
      </div>
    );
  }

  // Get smart workout recommendation
  const { recommendedId: nextWorkoutKey, reason: recommendationReason } = getRecommendedWorkout({
    plans,
    workouts,
    lastWorkout,
    streak
  });
  const suggestedWorkout = nextWorkoutKey ? plans[nextWorkoutKey] : null;
  const recommendationLabel = getRecommendationReason(recommendationReason, suggestedWorkout);
  
  // Get contextual next action hint
  const nextActionHint = getNextActionHint({
    streak,
    workouts,
    lastWorkout,
    suggestedWorkout
  });
  const displayName = profile?.display_name || userName;

  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          userPhoto={userPhoto}
          userName={userName}
          existingApiKey={apiKey}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2 text-amber-950 text-sm font-medium safe-area-top">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Changes will sync when you're back online.</span>
        </div>
      )}

      {/* Back Online Toast */}
      {wasOffline && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-emerald-500/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2 text-emerald-950 text-sm font-medium safe-area-top animate-in fade-in slide-in-from-top duration-300">
          <Wifi className="w-4 h-4" />
          <span>You're back online!</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title="Leave Workout?"
        message="You have unsaved exercise data. Are you sure you want to leave?"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
        confirmText="Leave"
      />

      {/* Workout Start Modal */}
      <WorkoutStartModal
        isOpen={showStartModal}
        workout={selectedWorkoutId ? plans[selectedWorkoutId] : null}
        lastWorkout={lastWorkout}
        onStart={handleStartWorkout}
        onClose={() => setShowStartModal(false)}
      />

      {/* Main Views */}
      {!showOnboarding && (
        <>
          {/* Home View */}
          {view === 'home' && (
            <HomeView
              userName={displayName}
              userPhoto={userPhoto}
              isAnonymous={isAnonymous}
              streak={streak}
              workouts={workouts}
              plans={plans}
              suggestedWorkout={suggestedWorkout}
              nextWorkoutKey={nextWorkoutKey}
              lastWorkout={lastWorkout}
              aiEnabled={aiEnabled}
              recommendationLabel={recommendationLabel}
              nextActionHint={nextActionHint}
              onSelectWorkout={handleSelectWorkout}
              onViewHistory={() => handleNavigate('history')}
            />
          )}

          {/* Workout View */}
          {view === 'workout' && activeWorkoutId && (
            <WorkoutView
              plan={plans[activeWorkoutId]}
              activeLog={activeLog}
              history={history}
              workoutNote={workoutNote}
              formatTime={formatTime}
              aiEnabled={aiEnabled}
              aiTips={aiTips}
              aiTipLoading={aiTipLoading}
              isSaving={isSaving}
              onBack={handleBackFromWorkout}
              onFinish={handleFinishWorkout}
              onUpdateLog={(name, sets) => setActiveLog(prev => ({ ...prev, [name]: { name, sets } }))}
              onUpdateNote={setWorkoutNote}
              onRequestTip={handleRequestTip}
            />
          )}

          {/* History View */}
          {view === 'history' && (
            <HistoryView
              workouts={workouts}
              onBack={() => handleNavigate('home')}
              onDelete={async (id) => {
                await deleteWorkout(id);
                setToast({ message: 'Session deleted', type: 'success' });
              }}
            />
          )}

          {/* Plans View */}
          {view === 'plans' && (
            <PlansView
              plans={plans}
              onSelectPlan={handleSelectWorkout}
              onEditPlan={(id) => {
                setEditingPlanId(id);
              }}
              onDeletePlan={async (id) => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Delete Workout Plan',
                  message: `Are you sure you want to delete "${plans[id]?.name}"? This action cannot be undone.`,
                  confirmText: 'Delete',
                  confirmVariant: 'danger',
                  onConfirm: async () => {
                    try {
                      await deletePlan(id);
                      setToast({ message: 'Plan deleted successfully', type: 'success' });
                    } catch (error) {
                      log.error('Error deleting plan:', error);
                      setToast({ message: 'Failed to delete plan', type: 'error' });
                    }
                    setConfirmModal({ isOpen: false });
                  }
                });
              }}
              onCreatePlan={() => setShowAddPlan(true)}
            />
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <SettingsView
              currentSettings={settings}
              profile={profile}
              isAnonymous={isAnonymous}
              onSave={async (newSettings) => {
                await saveSettings(newSettings);
                setToast({ message: 'Settings saved!', type: 'success' });
              }}
              onEditProfile={() => setShowEditProfile(true)}
              onSignOut={signOut}
              onDeleteAccount={async () => {
                try {
                  await deleteAccount();
                  setToast({ message: 'Account deleted', type: 'success' });
                } catch (error) {
                  setToast({ message: 'Failed to delete account', type: 'error' });
                }
              }}
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Buddy View - AI Coach */}
          {view === 'buddy' && (
            <BuddyView
              profile={profile}
              workouts={workouts}
              streak={streak}
              plans={plans}
              aiEnabled={aiEnabled}
              apiKey={apiKey}
              onNavigate={handleNavigate}
            />
          )}

          {/* Edit Profile Modal */}
          <EditProfileModal
            isOpen={showEditProfile}
            onClose={() => setShowEditProfile(false)}
            profile={profile}
            onSave={async (updatedProfile) => {
              try {
                await saveProfile(updatedProfile);
                setShowEditProfile(false);
                setToast({ message: 'Profile updated!', type: 'success' });
              } catch (error) {
                log.error('Error saving profile:', error);
                setToast({ message: 'Failed to update profile', type: 'error' });
              }
            }}
          />

          {/* Add Plan Modal */}
          <AddPlanModal
            isOpen={showAddPlan}
            onClose={() => setShowAddPlan(false)}
            apiKey={apiKey}
            experienceLevel={profile?.experience_level || 'intermediate'}
            profile={profile}
            workouts={workouts}
            plans={plans}
            streak={streak}
            onSave={async (data) => {
              try {
                // Merge new plans with existing plans (handle null/undefined plans)
                const existingPlans = plans || {};
                const mergedPlans = {
                  ...existingPlans,
                  ...data.plans
                };
                
                log.log('Saving plans:', { existing: Object.keys(existingPlans).length, new: Object.keys(data.plans).length, merged: Object.keys(mergedPlans).length });
                
                const source = data.type === 'ai-generated' ? 'ai-generated' : data.type === 'template' ? 'template' : 'custom';
                await savePlans(mergedPlans, source);
                setShowAddPlan(false);
                setToast({ message: 'New workout plan added!', type: 'success' });
              } catch (error) {
                log.error('Error adding plan:', error);
                setToast({ message: `Failed to add plan: ${error.message || 'Unknown error'}`, type: 'error' });
              }
            }}
          />

          {/* Edit Plan Modal */}
          <EditPlanModal
            isOpen={editingPlanId !== null}
            onClose={() => setEditingPlanId(null)}
            plan={editingPlanId !== null ? { id: editingPlanId, ...plans[editingPlanId] } : null}
            onSave={async (updatedPlan) => {
              try {
                const { id, ...planData } = updatedPlan;
                await updatePlan(id, planData);
                setEditingPlanId(null);
                setToast({ message: 'Plan updated successfully!', type: 'success' });
              } catch (error) {
                log.error('Error updating plan:', error);
                setToast({ message: 'Failed to update plan', type: 'error' });
              }
            }}
            onDelete={async (planId) => {
              setConfirmModal({
                isOpen: true,
                title: 'Delete Workout Plan',
                message: `Are you sure you want to delete "${plans[planId]?.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                confirmVariant: 'danger',
                onConfirm: async () => {
                  try {
                    await deletePlan(planId);
                    setEditingPlanId(null);
                    setToast({ message: 'Plan deleted successfully', type: 'success' });
                  } catch (error) {
                    log.error('Error deleting plan:', error);
                    setToast({ message: 'Failed to delete plan', type: 'error' });
                  }
                  setConfirmModal({ isOpen: false });
                }
              });
            }}
          />

          {/* Bottom Navigation - Hidden during active workout */}
          <BottomNavigation 
            currentView={view} 
            onNavigate={handleNavigate}
            workoutActive={view === 'workout'}
            aiEnabled={aiEnabled}
          />
        </>
      )}
    </div>
  );
}

// Home View Component
function HomeView({ 
  userName, userPhoto, isAnonymous, streak, workouts, plans,
  suggestedWorkout, nextWorkoutKey, lastWorkout, aiEnabled,
  recommendationLabel, nextActionHint,
  onSelectWorkout, onViewHistory 
}) {
  const isFirstTime = workouts.length === 0;

  // Helper to get hint styling based on type
  const getHintStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'motivation':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-400';
    }
  };

  return (
    <div className="p-6 pb-28 max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 safe-area-top">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="w-12 h-12 rounded-full border-2 border-gray-800" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-100">
              {isFirstTime ? `Welcome${userName !== 'there' ? `, ${userName}` : ''}! 👋` : `Hi ${userName}`}
            </h1>
            <p className="text-gray-500 text-xs">
              {isAnonymous ? 'Guest Mode' : (lastWorkout ? `Last: ${lastWorkout.workoutName}` : "Let's start your journey")}
            </p>
          </div>
        </div>
        {aiEnabled && (
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Next Action Hint */}
      {nextActionHint && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${getHintStyle(nextActionHint.type)}`}>
          {nextActionHint.message}
        </div>
      )}

      {/* Streak Card */}
      {streak > 0 && <StreakCard streak={streak} />}

      {/* Main Workout Card - Now uses slide modal */}
      {suggestedWorkout ? (
        <WorkoutCard 
          workout={suggestedWorkout} 
          onClick={() => onSelectWorkout(nextWorkoutKey)} 
          recommended
          recommendationLabel={recommendationLabel}
        />
      ) : Object.keys(plans).length === 0 && (
        <Card hover={false} className="p-6 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-300 mb-2">No workout plans yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first routine to start tracking workouts
          </p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card onClick={onViewHistory} className="p-4 flex flex-col items-center gap-2">
          <History className="w-6 h-6 text-emerald-400" />
          <span className="text-sm font-bold text-gray-200">{workouts.length}</span>
          <span className="text-xs text-gray-500">Total Workouts</span>
        </Card>
        <Card className="p-4 flex flex-col items-center gap-2">
          <Flame className="w-6 h-6 text-amber-400" />
          <span className="text-sm font-bold text-gray-200">{streak}</span>
          <span className="text-xs text-gray-500">Day Streak</span>
        </Card>
      </div>

      {/* Other Workouts - Now all use slide modal */}
      {Object.values(plans).filter(plan => plan.id !== nextWorkoutKey).length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-1">
            Other Routines
          </h3>
          <div className="space-y-3">
            {Object.values(plans)
              .filter(plan => plan.id !== nextWorkoutKey)
              .map(plan => (
                <WorkoutCard 
                  key={plan.id} 
                  workout={plan} 
                  onClick={() => onSelectWorkout(plan.id)} 
                  compact 
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// Workout View Component
function WorkoutView({
  plan, activeLog, history, workoutNote, formatTime,
  aiEnabled, aiTips, aiTipLoading, isSaving,
  onBack, onFinish, onUpdateLog, onUpdateNote, onRequestTip
}) {
  const completedCount = Object.keys(activeLog).filter(name => {
    const log = activeLog[name];
    return log?.sets?.some(s => s.weight && s.reps);
  }).length;

  return (
    <div className="pb-40 max-w-lg mx-auto min-h-screen safe-area-top">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/90 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-100">{plan.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <Timer className="w-3 h-3" />
                  {formatTime()}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-sm font-bold text-emerald-400">
              {completedCount}/{plan.exercises.length}
            </p>
          </div>
        </div>
        <ProgressBar completed={completedCount} total={plan.exercises.length} />
      </div>

      <div className="p-6 space-y-6">
        <RestTimer />

        {plan.exercises.map((ex, idx) => (
          <ExerciseLogger
            key={idx}
            exercise={ex}
            lastLog={history[ex.name]}
            onUpdate={(sets) => onUpdateLog(ex.name, sets)}
            aiTip={aiTips[ex.name]}
            onRequestTip={aiEnabled ? () => onRequestTip(ex.name) : null}
            aiLoading={aiTipLoading[ex.name]}
            isCompleted={activeLog[ex.name]?.sets?.some(s => s.weight && s.reps)}
          />
        ))}

        {/* Notes */}
        <Card hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold">
            <StickyNote className="w-4 h-4" />
            <h3>Session Notes</h3>
          </div>
          <Textarea
            value={workoutNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            placeholder="How did it feel? Any pain? Good pump?"
            className="h-24"
          />
        </Card>
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-50 safe-area-bottom">
        <Button
          onClick={onFinish}
          disabled={isSaving}
          loading={isSaving}
          size="xl"
          className="w-full"
          icon={Save}
        >
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

// History View Component
function HistoryView({ workouts, onBack, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    return `${Math.floor(seconds / 60)} min`;
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen">
      <ViewHeader 
        title="Workout History" 
        subtitle={`${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`}
      />

      <div className="p-6 space-y-3">
        {workouts.length === 0 && (
          <Card hover={false} className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-400 mb-2">No workouts yet</h3>
            <p className="text-sm text-gray-600 mb-4">Start your first workout to see your history here</p>
            <Button onClick={onBack} size="sm">Start Workout</Button>
          </Card>
        )}

        {workouts.map((session) => {
          const isExpanded = expandedId === session.id;
          const date = session.timestamp;

          return (
            <Card key={session.id} hover={false} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-200">{session.workoutName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {session.duration && (
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                          {formatDuration(session.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {session.exercises?.length || 0} exercises
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-4">
                    {session.exercises?.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 font-medium">{ex.name}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {ex.sets?.map((s, si) => (
                            <span key={si} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                              {s.weight}kg×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {session.note && (
                    <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                      <p className="text-xs text-gray-500 italic">"{session.note}"</p>
                    </div>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session.id);
                    }}
                  >
                    Delete Session
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Workout?"
        message="This action cannot be undone. Your workout data will be permanently removed."
        onConfirm={() => {
          onDelete(deleteConfirm);
          setDeleteConfirm(null);
          setExpandedId(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// Settings View Component
function SettingsView({ currentSettings, profile, isAnonymous, onSave, onEditProfile, onSignOut, onDeleteAccount, onBack }) {
  const [aiEnabled, setAiEnabled] = useState(currentSettings?.ai_enabled || false);
  const [apiKey, setApiKey] = useState(currentSettings?.google_api_key || '');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setAiEnabled(currentSettings.ai_enabled || false);
      setApiKey(currentSettings.google_api_key || '');
      // If we already have a saved API key, consider it verified
      setIsVerified(!!currentSettings.google_api_key);
    }
  }, [currentSettings]);

  // Reset verification when API key changes
  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    setError('');
    setSuccessMessage('');
    // Only reset verification if key changed from saved value
    if (newKey !== currentSettings?.google_api_key) {
      setIsVerified(false);
    }
  };

  // Verify API key
  const handleVerifyKey = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await verifyApiKey(apiKey);
      if (result.valid) {
        setIsVerified(true);
        setSuccessMessage('API key verified! ✓');
      } else {
        setError(result.error || 'Invalid API key');
        setIsVerified(false);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    // If AI is enabled but key isn't verified, verify first
    if (aiEnabled && apiKey && !isVerified) {
      setError('Please verify your API key first');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await onSave({
        ai_enabled: aiEnabled,
        google_api_key: aiEnabled ? apiKey : null,
        onboarding_completed: true
      });
      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await onSignOut();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen">
      <ViewHeader 
        title="Settings" 
        subtitle="Manage your account"
      />

      <div className="p-6 space-y-4">
        {/* Profile Info */}
        {profile && (
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-14 h-14 rounded-full" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-200 text-lg">{profile.display_name}</p>
                <p className="text-sm text-gray-500">
                  {profile.experience_level ? `${profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} lifter` : ''}
                  {profile.age ? ` • ${profile.age} years old` : ''}
                </p>
              </div>
              <button
                onClick={onEditProfile}
                className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all text-gray-400 hover:text-gray-200"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* AI Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">AI Features</h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-200">AI Workout Buddy</p>
                <p className="text-xs text-gray-500">Get personalized tips</p>
              </div>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative w-12 h-6 rounded-full transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${aiEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {aiEnabled && (
            <div className="space-y-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-semibold text-gray-300">
                Google AI Studio API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="AIza..."
                    icon={Key}
                  />
                </div>
                <Button
                  onClick={handleVerifyKey}
                  disabled={!apiKey || verifying || isVerified}
                  loading={verifying}
                  variant={isVerified ? 'primary' : 'secondary'}
                  className={`px-4 ${isVerified ? 'bg-emerald-600' : ''}`}
                >
                  {isVerified ? <Check className="w-4 h-4" /> : 'Verify'}
                </Button>
              </div>
              
              {/* Status messages */}
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <X className="w-4 h-4" /> {error}
                </p>
              )}
              {successMessage && !error && (
                <p className="text-sm text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {successMessage}
                </p>
              )}
              {isVerified && !successMessage && !error && (
                <p className="text-xs text-emerald-400/70 flex items-center gap-1">
                  <Check className="w-3 h-3" /> API key verified
                </p>
              )}
              
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                Get your API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || (aiEnabled && (!apiKey || !isVerified))}
            loading={saving}
            className="w-full"
          >
            Save Settings
          </Button>
          
          {/* Success message for save */}
          {successMessage && successMessage.includes('saved') && (
            <p className="text-sm text-emerald-400 text-center flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> {successMessage}
            </p>
          )}
        </div>

        {/* Account Section */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">Account</h3>
          
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full"
            icon={LogOut}
          >
            {isAnonymous ? 'Sign Out (Guest)' : 'Sign Out'}
          </Button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2 bg-red-500/5 rounded-xl border border-red-500/20"
            >
              <UserX className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400">Delete Account?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This will permanently delete your account and all workout data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  loading={deleteLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
