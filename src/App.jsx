import { useState, useEffect, lazy, Suspense } from 'react';
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
import { useNotes } from './hooks/useNotes';
import { useNotifications } from './hooks/useNotifications';
import { useExerciseTips } from './hooks/useExerciseTips';

// Eagerly loaded components (critical path)
import { Card } from './components/ui/Card';
import { Button, IconButton } from './components/ui/Button';
import { Input, Textarea } from './components/ui/Input';
import { Toast } from './components/ui/Toast';
import { Modal, ConfirmDialog } from './components/ui/Modal';
import { WorkoutStartModal } from './components/workout/WorkoutStartModal';
import { WorkoutCompleteModal } from './components/workout/WorkoutCompleteModal';
import { OnboardingFlow } from './components/onboarding';
import { BottomNavigation } from './components/layout/Navigation';
import { BackgroundEffects } from './components/ui/BackgroundEffects';

// Lazy loaded view components (code splitting)
const HomeView = lazy(() => import('./components/views/HomeView'));
const WorkoutView = lazy(() => import('./components/views/WorkoutView'));
const HistoryView = lazy(() => import('./components/views/HistoryView'));
const SettingsView = lazy(() => import('./components/views/SettingsView'));
const PlansView = lazy(() => import('./components/views/PlansView'));
const BuddyView = lazy(() => import('./components/views/BuddyView'));
const EditProfileView = lazy(() => import('./components/views/EditProfileView'));
const AddPlanView = lazy(() => import('./components/views/AddPlanView'));
const EditPlanView = lazy(() => import('./components/views/EditPlanView'));

// Lazy loaded modals (not needed on initial render)
const QuickPlanGenerator = lazy(() => import('./components/plans/QuickPlanGenerator'));
const ExportModal = lazy(() => import('./components/views/ExportModal'));
const LogPastWorkoutView = lazy(() => import('./components/views/LogPastWorkoutView'));
const NotificationSettingsModal = lazy(() => import('./components/settings/NotificationSettingsModal'));

// Constants & Services
import { DEFAULT_WORKOUT_PLANS } from './constants/defaults';
import { getExerciseTip, verifyApiKey } from './services/ai';
import { createLogger } from './utils/logger';
import { getRecommendedWorkout, getNextActionHint, getRecommendationReason } from './utils/workoutRecommendation';
import { buildUserContextForAI } from './utils/aiContext';

const log = createLogger('App');

// Loading fallback component
function ViewLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-950">
      <div className="text-center animate-pulse">
        <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, userName, userPhoto, isAnonymous, signInWithGoogle, signInAnonymously, signOut, deleteAccount } = useAuth();
  const { settings, saveSettings, aiEnabled, apiKey, onboardingCompleted, loading: settingsLoading } = useSettings(user?.id);
  const { profile, saveProfile, hasProfile, loading: profileLoading } = useProfile(user?.id);
  const { 
    plans, 
    savePlans, 
    deletePlan, 
    hasCustomPlans, 
    loading: plansLoading,
    folders,
    createFolder,
    deleteFolder,
    movePlansToFolder,
    deletePlans
  } = useWorkoutPlans(user?.id);
  const { workouts, history, lastWorkout, streak, loading: workoutsLoading, saveWorkout, deleteWorkout } = useWorkouts(user?.id);
  const { isOnline, wasOffline } = useNetworkStatus();
  const { notes, saveNote, deleteNote, loading: notesLoading } = useNotes(user?.id);
  const { 
    settings: notificationSettings, 
    saveSettings: saveNotificationSettings, 
    requestPermission: requestNotificationPermission,
    sendTestNotification,
    permissionStatus: notificationPermissionStatus 
  } = useNotifications(user?.id);
  const { getTips: getExerciseFormTips, loading: exerciseTipsLoading } = useExerciseTips(apiKey);
  
  // Navigation state
  const [view, setView] = useState('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedWorkoutStats, setCompletedWorkoutStats] = useState(null);
  
  // Active workout state
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [tempPlan, setTempPlan] = useState(null); // For quick workouts
  const [activeLog, setActiveLog] = useState({});
  const [workoutNote, setWorkoutNote] = useState('');
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [historyTab, setHistoryTab] = useState('history');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [logPastInitialExercise, setLogPastInitialExercise] = useState(null);
  
  // New modal states (Tasks 5, 7, 8, 10)
  const [showQuickPlanGenerator, setShowQuickPlanGenerator] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // AI tips state
  const [aiTips, setAiTips] = useState({});
  const [aiTipLoading, setAiTipLoading] = useState({});

  const { formatTime, reset: resetTimer } = useTimer(view === 'workout');
  const { suggestWeight, generateSummary } = useAI(apiKey, aiEnabled);

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
    // Scroll to top on navigation
    window.scrollTo(0, 0);

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

  // AI Buddy state
  const [initialAiPrompt, setInitialAiPrompt] = useState(null);

  // Handle Quick Actions from Home
  const handleQuickAction = (prompt) => {
    setInitialAiPrompt(prompt);
    setView('buddy');
  };

  // Handle saving AI plan
  const handleAiSavePlan = async (newPlan) => {
    try {
      // 1. Find or create AI folder
      let aiFolder = folders.find(f => f.name === 'AI Workouts');
      
      if (!aiFolder) {
        try {
          aiFolder = await createFolder('AI Workouts', 'purple');
        } catch (err) {
          log.error('Failed to create AI folder', err);
        }
      }

      const existingPlans = plans || {};
      const planId = newPlan.id || `ai-${Date.now()}`;
      const mergedPlans = {
        ...existingPlans,
        [planId]: { 
          ...newPlan, 
          id: planId,
          folderId: aiFolder?.id || null
        }
      };

      await savePlans(mergedPlans, 'ai');
      setToast({ message: `Saved "${newPlan.name}" to ${aiFolder ? 'AI Workouts' : 'Plans'}`, type: 'success' });
    } catch (error) {
      log.error('Error saving AI plan:', error);
      setToast({ message: 'Failed to save plan', type: 'error' });
    }
  };

  // Handle starting AI plan immediately
  const handleAiStartWorkout = async (plan) => {
    try {
      const planId = await handleAiSavePlan(plan);
      setSelectedWorkoutId(planId);
      setShowStartModal(true);
    } catch (error) {
      // Error handled in handleAiSavePlan
    }
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

  const handleStartQuickWorkout = (exercise) => {
    const quickPlan = {
      id: 'quick-log',
      name: exercise.name,
      exercises: [{
        name: exercise.name,
        sets: 3,
        range: '8-12',
        muscleGroup: exercise.muscle_group,
        tip: exercise.description
      }],
      estTime: '15 min'
    };
    setTempPlan(quickPlan);
    setActiveWorkoutId('quick-log');
    setWorkoutStartTime(Date.now());
    resetTimer();
    setActiveLog({});
    setWorkoutNote('');
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
    const isQuickWorkout = activeWorkoutId === 'quick-log';
    const workoutName = isQuickWorkout ? tempPlan?.name : plans[activeWorkoutId]?.name || activeWorkoutId;
    
    try {
      const duration = Math.floor((Date.now() - workoutStartTime) / 1000);
      
      // Generate AI summary if enabled (skip for quick workouts since we don't show the modal)
      let aiAnalysis = null;
      if (aiEnabled && apiKey && !isQuickWorkout) {
        const userContext = buildUserContextForAI({ profile, workouts, streak, plans });
        // Create a temporary workout object for analysis
        const workoutForAnalysis = {
          workoutName: workoutName,
          duration,
          exercises: exercisesList
        };
        aiAnalysis = await generateSummary(workoutForAnalysis, userContext);
      }

      await saveWorkout({
        workoutType: activeWorkoutId,
        workoutName: workoutName,
        exercises: exercisesList,
        note: workoutNote,
        duration: duration
      });
      
      // For quick workouts, skip celebration modal and show toast instead
      if (isQuickWorkout) {
        setToast({ message: 'Workout logged!', type: 'success' });
        setActiveWorkoutId(null);
        setTempPlan(null);
        handleNavigate('home');
      } else {
        // Show completion modal for regular workouts
        setCompletedWorkoutStats({
          name: workoutName,
          duration: duration,
          exercisesCount: exercisesList.length,
          analysis: aiAnalysis
        });
        setShowCompleteModal(true);
        
        // Reset active state but keep view until modal closes
        setActiveWorkoutId(null);
      }
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
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gray-950 px-6 py-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-md flex-1 flex flex-col items-center justify-center">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="relative w-24 h-24 mx-auto mb-8 group">
              <div className="absolute inset-0 bg-emerald-500 rounded-3xl rotate-6 opacity-20 group-hover:rotate-12 transition-transform duration-500" />
              <div className="absolute inset-0 bg-emerald-500 rounded-3xl -rotate-6 opacity-20 group-hover:-rotate-12 transition-transform duration-500" />
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Dumbbell className="w-12 h-12 text-gray-950" />
              </div>
            </div>
            
            <h1 className="text-5xl font-display font-bold text-white tracking-tighter mb-3">
              WORKOUT<span className="text-emerald-400">LOG</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase opacity-60">
              Train Smart • Track Progress
            </p>
          </div>

          {/* Actions */}
          <div className="w-full space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full py-4 px-6 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-900 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-white/5"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto pt-8 pb-safe">
          <p className="text-xs text-gray-600 text-center max-w-xs mx-auto leading-relaxed">
            By continuing, you agree to our <br/>
            <span className="text-gray-500">Terms of Service</span> & <span className="text-gray-500">Privacy Policy</span>
          </p>
        </div>
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
    <div className="min-h-screen bg-gray-950 font-sans relative">
      <BackgroundEffects />
      
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
        title="End Workout?"
        message="You have unsaved progress. If you leave now, your workout data will be lost."
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
        confirmText="End Workout"
        confirmVariant="danger"
      />

      {/* Workout Start Modal */}
      <WorkoutStartModal
        isOpen={showStartModal}
        workout={selectedWorkoutId ? plans[selectedWorkoutId] : null}
        lastWorkout={lastWorkout}
        onStart={handleStartWorkout}
        onClose={() => setShowStartModal(false)}
      />

      {/* Workout Complete Modal */}
      <WorkoutCompleteModal
        isOpen={showCompleteModal}
        workoutName={completedWorkoutStats?.name}
        duration={completedWorkoutStats?.duration}
        exercisesCount={completedWorkoutStats?.exercisesCount}
        analysis={completedWorkoutStats?.analysis}
        onClose={() => {
          setShowCompleteModal(false);
          setCompletedWorkoutStats(null);
          handleNavigate('home');
        }}
      />

      {/* Main Views - Lazy loaded with Suspense */}
      {!showOnboarding && (
        <>
          <Suspense fallback={<ViewLoader />}>
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
                onViewHistory={() => {
                  setHistoryTab('history');
                  handleNavigate('history');
                }}
                onQuickLog={() => {
                  setHistoryTab('exercises');
                  handleNavigate('history');
                }}
                onSettings={() => handleNavigate('settings')}
                onBuddy={() => setView('buddy')}
                onQuickAction={handleQuickAction}
              />
            )}

            {/* Workout View */}
            {view === 'workout' && activeWorkoutId && (
              <WorkoutView
                plan={activeWorkoutId === 'quick-log' ? tempPlan : plans[activeWorkoutId]}
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
                onSuggestWeight={async (exerciseName, targetReps) => {
                  const userContext = buildUserContextForAI({ profile, workouts, streak, plans });
                  return await suggestWeight(exerciseName, history[exerciseName]?.sets || [], targetReps, userContext);
                }}
              />
            )}

            {/* History View */}
            {view === 'history' && (
              <HistoryView
                workouts={workouts}
                plans={plans}
                initialTab={historyTab}
                onBack={() => handleNavigate('home')}
                onStartQuickWorkout={handleStartQuickWorkout}
                onDelete={async (id) => {
                  await deleteWorkout(id);
                  setToast({ message: 'Session deleted', type: 'success' });
                }}
                onSaveWorkout={async (workoutData) => {
                  try {
                    await saveWorkout(workoutData);
                    setToast({ message: 'Past workout logged!', type: 'success' });
                  } catch (error) {
                    log.error('Error saving past workout:', error);
                    setToast({ message: 'Failed to log workout', type: 'error' });
                  }
                }}
                activeTab={historyTab}
                onTabChange={setHistoryTab}
                onExport={() => setShowExportModal(true)}
                onAddPastWorkout={(exercise) => {
                  setLogPastInitialExercise(exercise || null);
                  handleNavigate('log-past');
                }}
                onToast={setToast}
              />
            )}

            {/* Log Past Workout View */}
            {view === 'log-past' && (
              <LogPastWorkoutView
                onBack={() => {
                  setLogPastInitialExercise(null);
                  handleNavigate('history');
                }}
                plans={plans}
                initialExercise={logPastInitialExercise}
                onSave={async (workoutData) => {
                  try {
                    await saveWorkout(workoutData);
                    setToast({ message: 'Past workout logged!', type: 'success' });
                    setLogPastInitialExercise(null);
                  } catch (error) {
                    log.error('Error saving past workout:', error);
                    setToast({ message: 'Failed to log workout', type: 'error' });
                  }
                }}
                onToast={setToast}
              />
            )}

            {/* Plans View */}
            {view === 'plans' && (
              <PlansView
                plans={plans}
                folders={folders}
                createFolder={createFolder}
                deleteFolder={deleteFolder}
                movePlansToFolder={movePlansToFolder}
                deletePlans={deletePlans}
                onSelectPlan={handleSelectWorkout}
                onEditPlan={(id) => {
                  setEditingPlanId(id);
                  handleNavigate('edit-plan');
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
                onCreatePlan={() => handleNavigate('add-plan')}
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
                onEditProfile={() => handleNavigate('edit-profile')}
                onNotificationSettings={() => setShowNotificationSettings(true)}
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

            {/* Edit Profile View */}
            {view === 'edit-profile' && (
              <EditProfileView
                profile={profile}
                userPhoto={userPhoto}
                onBack={() => handleNavigate('settings')}
                onSave={async (updatedProfile) => {
                  try {
                    await saveProfile(updatedProfile);
                    setToast({ message: 'Profile updated!', type: 'success' });
                  } catch (error) {
                    log.error('Error saving profile:', error);
                    setToast({ message: 'Failed to update profile', type: 'error' });
                  }
                }}
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
                notes={notes}
                onSaveNote={saveNote}
                onDeleteNote={deleteNote}
                onNavigate={handleNavigate}
                initialPrompt={initialAiPrompt}
                onSavePlan={handleAiSavePlan}
                onStartWorkout={handleAiStartWorkout}
                isOnline={isOnline}
              />
            )}

            {/* Add Plan View */}
            {view === 'add-plan' && (
              <AddPlanView
                onBack={() => handleNavigate('plans')}
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
                    handleNavigate('plans');
                    setToast({ message: 'New workout plan added!', type: 'success' });
                  } catch (error) {
                    log.error('Error adding plan:', error);
                    setToast({ message: `Failed to add plan: ${error.message || 'Unknown error'}`, type: 'error' });
                  }
                }}
              />
            )}
          </Suspense>

          {/* Lazy loaded modals */}
          <Suspense fallback={null}>
            {/* Edit Plan View */}
            {view === 'edit-plan' && editingPlanId && (
              <EditPlanView
                plan={plans[editingPlanId] ? { id: editingPlanId, ...plans[editingPlanId] } : null}
                onBack={() => {
                  setEditingPlanId(null);
                  handleNavigate('plans');
                }}
                onSave={async (updatedPlan) => {
                  try {
                    // Use editingPlanId directly since updatedPlan might not contain the ID
                    await updatePlan(editingPlanId, updatedPlan);
                    setEditingPlanId(null);
                    handleNavigate('plans');
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
                        handleNavigate('plans');
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
            )}
          </Suspense>

          {/* Lazy loaded modals */}
          <Suspense fallback={null}>
            {/* Quick Plan Generator Modal (Task 5) */}

          {/* Quick Plan Generator Modal (Task 5) */}
          <QuickPlanGenerator
            isOpen={showQuickPlanGenerator}
            onClose={() => setShowQuickPlanGenerator(false)}
            apiKey={apiKey}
            profile={profile}
            onLogWorkout={async (workoutData) => {
              try {
                await saveWorkout(workoutData);
                setToast({ message: 'Workout logged!', type: 'success' });
              } catch (error) {
                log.error('Error saving workout:', error);
                setToast({ message: 'Failed to log workout', type: 'error' });
              }
            }}
            onSaveAsTemplate={async (templateData) => {
              try {
                const existingPlans = plans || {};
                const mergedPlans = { ...existingPlans, [templateData.id]: templateData };
                await savePlans(mergedPlans, 'ai-generated');
                setToast({ message: 'Saved to routines!', type: 'success' });
              } catch (error) {
                log.error('Error saving template:', error);
                setToast({ message: 'Failed to save template', type: 'error' });
              }
            }}
            onToast={setToast}
          />

          {/* Export Modal (Task 8) */}
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            workouts={workouts}
            onToast={setToast}
          />

          {/* Notification Settings Modal (Task 7) */}
          <NotificationSettingsModal
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
            settings={notificationSettings}
            permissionStatus={notificationPermissionStatus}
            onSave={saveNotificationSettings}
            onRequestPermission={requestNotificationPermission}
            onTestNotification={sendTestNotification}
            onToast={setToast}
          />
          </Suspense>

          {/* Bottom Navigation - Hidden during active workout */}
          <BottomNavigation 
            currentView={view} 
            onNavigate={handleNavigate}
            workoutActive={view === 'workout' || showStartModal}
            aiEnabled={aiEnabled}
          />
        </>
      )}
    </div>
  );
}
