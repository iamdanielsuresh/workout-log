import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, TrendingUp, Target, Flame, Brain, 
  MessageCircle, ChevronRight, Zap, Trophy, 
  Calendar, Dumbbell, RefreshCw, Send, X,
  ArrowUp, Heart, Star, Award, AlertCircle, Key, Settings, Clock,
  Bookmark, BookmarkCheck, StickyNote, Search, Filter, Trash2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ViewHeader } from '../layout/Navigation';
import { 
  buildUserContextForAI, 
  formatContextForPrompt,
  buildMotivationPrompt,
  buildInsightsPrompt,
  buildTipsPrompt,
  getSuggestedPrompts,
  PERSONAS as PERSONA_DEFINITIONS
} from '../../utils/aiContext';
import { 
  checkAiAvailability, 
  getAiClientConfig,
  getAiStatusMessage 
} from '../../utils/aiConfig';
import { makeAIRequest } from '../../services/ai';
import {
  getWorkoutSummary,
  getWorkoutsThisWeek,
  getAverageSessionDuration,
  getRecentFocusDistribution
} from '../../utils/workoutStats';
import DeepAnalysisModal from './DeepAnalysisModal';
import { AIChatOverlay } from './AIChatOverlay';

/**
 * AI Buddy View - Interactive AI coaching with reports, insights, tips
 * Task 2: Added notes saving functionality
 * Only available when AI is enabled
 */
export function BuddyView({ 
  aiEnabled, 
  apiKey, 
  profile, 
  workouts, 
  streak,
  plans,
  notes = [],
  onSaveNote,
  onDeleteNote,
  onNavigate,
  initialPrompt,
  onSavePlan,
  onStartWorkout
}) {
  // Handle initial prompt from Quick Actions
  useEffect(() => {
    if (initialPrompt) {
      setIsChatOpen(true);
      handleChat(initialPrompt);
    }
  }, [initialPrompt]);
  const [activeSection, setActiveSection] = useState(null);
  const [insights, setInsights] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [showNotes, setShowNotes] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesCategoryFilter, setNotesCategoryFilter] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [coachPersona, setCoachPersona] = useState('supportive'); // 'supportive', 'sergeant', 'scientist', 'stoic'
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatEndRef = useRef(null);

  // Persona icons mapping
  const PERSONA_ICONS = {
    supportive: Sparkles,
    sergeant: Flame,
    scientist: Brain
  };

  // Theme colors mapping
  const THEME_COLORS = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      bgLow: 'bg-emerald-500/10',
      border: 'border-emerald-500',
      shadow: 'shadow-emerald-500/10',
      hoverText: 'hover:text-emerald-400'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      bgLow: 'bg-amber-500/10',
      border: 'border-amber-500',
      shadow: 'shadow-amber-500/10',
      hoverText: 'hover:text-amber-400'
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500',
      bgLow: 'bg-blue-500/10',
      border: 'border-blue-500',
      shadow: 'shadow-blue-500/10',
      hoverText: 'hover:text-blue-400'
    }
  };

  const currentTheme = THEME_COLORS[PERSONA_DEFINITIONS[coachPersona].themeColor] || THEME_COLORS.emerald;

  // Calculate suggested prompts based on context
  const suggestedPrompts = useMemo(() => {
    const lastWorkout = workouts[0];
    const timeSinceLastWorkout = lastWorkout 
      ? (new Date() - new Date(lastWorkout.timestamp)) / (1000 * 60 * 60) 
      : 999;
      
    return getSuggestedPrompts({
      streak,
      lastWorkout,
      timeSinceLastWorkout
    });
  }, [workouts, streak]);

  // Check AI availability using centralized config
  const aiAvailability = useMemo(() => 
    checkAiAvailability({ aiEnabled, apiKey }),
    [aiEnabled, apiKey]
  );
  
  const aiConfig = useMemo(() =>
    getAiClientConfig({ aiEnabled, apiKey }),
    [aiEnabled, apiKey]
  );

  // Calculate workout stats using centralized utility
  const workoutStats = useMemo(() => 
    getWorkoutSummary(workouts),
    [workouts]
  );

  // Build user context for AI - memoized to avoid recalculating
  const userContext = useMemo(() => 
    buildUserContextForAI({ profile, workouts, streak, plans }),
    [profile, workouts, streak, plans]
  );

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Generate insights on mount if we have enough data and AI is available
  useEffect(() => {
    if (aiAvailability.available && workouts.length >= 1 && !insights) {
      generateInsights();
    }
  }, [aiAvailability.available, workouts.length]);

  // Clear content when persona changes to encourage regeneration
  useEffect(() => {
    setMotivation(null);
    setInsights(null);
    setTips([]);
    setChatMessages([]);
  }, [coachPersona]);

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const generateInsights = async () => {
    if (!aiAvailability.available) return;
    setLoading(prev => ({ ...prev, insights: true }));
    clearError('insights');
    
    try {
      const prompt = buildInsightsPrompt(userContext, coachPersona);
      const response = await makeAIRequest(apiKey, prompt);
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      setInsights(JSON.parse(cleaned));
    } catch (error) {
      console.error('Error generating insights:', error);
      setErrors(prev => ({ ...prev, insights: error.message || 'Failed to generate insights' }));
      // Provide fallback insights based on real data
      setInsights({
        summary: workouts.length > 0 
          ? `You've completed ${workouts.length} workouts - keep building that momentum!`
          : "You're just getting started - every journey begins with a single step!",
        strength: streak > 0 
          ? `${streak}-day streak shows great consistency`
          : "Taking the first step to track your workouts",
        improvement: userContext.avgSessionDuration < 30 && userContext.avgSessionDuration > 0
          ? "Consider adding 1-2 more exercises to extend your sessions"
          : "Try tracking your rest times between sets",
        nextGoal: `Complete ${Math.max(3, userContext.last7DaysWorkouts + 1)} workouts this week`
      });
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  };

  const generateMotivation = async () => {
    if (!aiAvailability.available) return;
    setLoading(prev => ({ ...prev, motivation: true }));
    clearError('motivation');

    try {
      const prompt = buildMotivationPrompt(userContext, coachPersona);
      const response = await makeAIRequest(apiKey, prompt);
      // Contextual fallback
      if (streak > 0) {
        setMotivation(`${streak} days strong! Your consistency is building something amazing. Keep pushing!`);
      } else if (workouts.length > 0) {
        setMotivation(`You've got ${workouts.length} workouts under your belt. Today's a great day to add another!`);
      } else {
        setMotivation("Every champion was once a beginner. Today is your day to start!");
      }
    } catch (error) {
      console.error('Error generating motivation:', error);
      setErrors(prev => ({ ...prev, motivation: error.message || 'Failed to get motivation' }));
    } finally {
      setLoading(prev => ({ ...prev, motivation: false }));
    }
  };

  const generateTips = async () => {
    if (!aiAvailability.available) return;
    setLoading(prev => ({ ...prev, tips: true }));
    clearError('tips');

    try {
      const prompt = buildTipsPrompt(userContext, coachPersona);
      const response = await makeAIRequest(apiKey, prompt);
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      setTips(JSON.parse(cleaned));
    } catch (error) {
      console.error('Error generating tips:', error);
      setErrors(prev => ({ ...prev, tips: error.message || 'Failed to generate tips' }));
    } finally {
      setLoading(prev => ({ ...prev, tips: false }));
    }
  };

  const handleChat = async (text) => {
    if (!text.trim() || !aiAvailability.available) return;

    const userMsg = { role: 'user', content: text, id: Date.now().toString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      // Build system prompt based on persona
      const personaDef = PERSONA_DEFINITIONS[coachPersona];
      const systemPrompt = `You are ${personaDef.name}, a ${personaDef.role}. \nTone: ${personaDef.tone}. \nStyle: ${personaDef.style}\nUser Context: ${formatContextForPrompt(userContext)}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text }
      ];

      // Use the chat endpoint or standard completion
      // For now using standard completion with history context
      const prompt = `${systemPrompt}\n\nChat History:\n${chatMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\nUser: ${text}\nAssistant:`;
      
      const response = await makeAIRequest(apiKey, prompt);
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response, 
        id: (Date.now() + 1).toString() 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting right now. Try again?", 
        id: (Date.now() + 1).toString(),
        error: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Task 2: Save note handler
  const handleSaveNote = async (messageContent, messageId, category = 'chat') => {
    if (!onSaveNote || savedMessageIds.has(messageId)) return;
    
    try {
      await onSaveNote(messageContent, category, 'chat');
      setSavedMessageIds(prev => new Set([...prev, messageId]));
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Filter notes based on search and category
  const filteredNotes = useMemo(() => {
    let result = notes || [];
    
    if (notesSearchQuery) {
      const query = notesSearchQuery.toLowerCase();
      result = result.filter(note => note.text.toLowerCase().includes(query));
    }
    
    if (notesCategoryFilter) {
      result = result.filter(note => note.category === notesCategoryFilter);
    }
    
    return result;
  }, [notes, notesSearchQuery, notesCategoryFilter]);

  const getTipIcon = (iconType) => {
    switch (iconType) {
      case 'form': return Dumbbell;
      case 'nutrition': return Heart;
      case 'recovery': return RefreshCw;
      case 'mindset': return Brain;
      default: return Star;
    }
  };

  // Error display component
  const ErrorMessage = ({ error, onRetry }) => (
    <div className="flex items-center gap-2 text-amber-400 text-xs mt-2">
      <AlertCircle className="w-3 h-3" />
      <span className="flex-1">Couldn't load - using offline data</span>
      {onRetry && (
        <button onClick={onRetry} className="underline hover:text-amber-300">
          Retry
        </button>
      )}
    </div>
  );

  // If AI not available, show prompt with specific reason
  if (!aiAvailability.available) {
    const statusMessage = getAiStatusMessage({ aiEnabled, apiKey });
    
    return (
      <div className="pb-nav max-w-lg mx-auto min-h-screen">
        <ViewHeader title="AI Buddy" subtitle="Your personal coach" />
        
        <div className="p-6">
          <Card hover={false} className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {aiAvailability.reasonCode === 'NO_KEY' || aiAvailability.reasonCode === 'INVALID_KEY' ? (
                <Key className="w-10 h-10 text-emerald-400" />
              ) : (
                <Sparkles className="w-10 h-10 text-emerald-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-3">
              {aiAvailability.reasonCode === 'DISABLED' ? 'Enable AI Buddy' : 'Configure AI'}
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              {aiAvailability.reasonCode === 'DISABLED' && 
                'Get personalized insights, workout tips, and motivation powered by AI.'}
              {aiAvailability.reasonCode === 'NO_KEY' && 
                'Add your Google AI API key to unlock AI features.'}
              {aiAvailability.reasonCode === 'INVALID_KEY' && 
                'Your API key appears invalid. Please check your settings.'}
            </p>
            <p className="text-xs text-gray-600 mb-6">{statusMessage.message}</p>
            <Button onClick={() => onNavigate('settings')} icon={Settings}>
              Go to Settings
            </Button>
          </Card>

          {/* Show enhanced stats even without AI */}
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Your Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <Card hover={false} className="p-4 text-center">
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-100">{workoutStats.currentStreak}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </Card>
              <Card hover={false} className="p-4 text-center">
                <Dumbbell className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-100">{workoutStats.totalWorkouts}</p>
                <p className="text-xs text-gray-500">Total Workouts</p>
              </Card>
              <Card hover={false} className="p-4 text-center">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-100">{workoutStats.workoutsThisWeek}</p>
                <p className="text-xs text-gray-500">This Week</p>
              </Card>
              <Card hover={false} className="p-4 text-center">
                <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-100">
                  {workoutStats.averageDuration > 0 ? `${workoutStats.averageDuration}m` : '--'}
                </p>
                <p className="text-xs text-gray-500">Avg Duration</p>
              </Card>
            </div>
            
            {/* Focus Distribution */}
            {workoutStats.totalWorkouts > 0 && (
              <Card hover={false} className="p-4">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Focus Areas
                </h5>
                <div className="flex gap-2">
                  {Object.entries(workoutStats.focusDistribution)
                    .filter(([_, count]) => count > 0)
                    .map(([focus, count]) => (
                      <div 
                        key={focus}
                        className="flex-1 text-center p-2 bg-gray-800/50 rounded-lg"
                      >
                        <p className="text-lg font-bold text-gray-200">{count}</p>
                        <p className="text-xs text-gray-500">{focus}</p>
                      </div>
                    ))
                  }
                  {Object.values(workoutStats.focusDistribution).every(c => c === 0) && (
                    <p className="text-sm text-gray-500 text-center w-full">
                      No focus data yet
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSavePlan = async (planData) => {
    try {
      if (onSavePlan) {
        await onSavePlan(planData);
        // Show success toast or feedback
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Saved "${planData.name}" to your plans!`,
          id: Date.now().toString()
        }]);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-950">
      <ViewHeader 
        title="AI Coach" 
        rightAction={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDeepAnalysis(true)}
            className={`${currentTheme.text} hover:bg-gray-800`}
          >
            <Brain className="w-6 h-6" />
          </Button>
        }
      />

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-4">
        {/* Persona Selector */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PERSONA_DEFINITIONS).map(([key, def]) => {
            const Icon = PERSONA_ICONS[key] || Sparkles;
            const isActive = coachPersona === key;
            const isBusy = Object.values(loading).some(Boolean) || chatLoading;
            const theme = THEME_COLORS[def.themeColor] || THEME_COLORS.emerald;
            
            return (
              <button
                key={key}
                onClick={() => setCoachPersona(key)}
                disabled={isBusy}
                className={`
                  relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300
                  ${isActive 
                    ? `${theme.bgLow} ${theme.border} shadow-lg ${theme.shadow}` 
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                  }
                  ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className={`
                  p-2.5 rounded-xl transition-all duration-300
                  ${isActive ? `${theme.bg} text-gray-950` : 'bg-gray-800 text-gray-500'}
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-medium transition-colors ${isActive ? theme.text : 'text-gray-500'}`}>
                  {def.name}
                </span>
                {isActive && (
                  <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${theme.bg}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Daily Motivation Section */}
        <Card hover={false} className="p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${currentTheme.bgLow}`}>
                <Zap className={`w-4 h-4 ${currentTheme.text}`} />
              </div>
              <h3 className={`text-sm font-display font-bold uppercase tracking-wider ${currentTheme.text}`}>Daily Motivation</h3>
            </div>
            
            <div className="min-h-[60px] flex items-center">
              {loading.motivation ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>{PERSONA_DEFINITIONS[coachPersona].name} is thinking...</span>
                </div>
              ) : motivation ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 w-full">
                  <p className="text-lg font-medium text-gray-100 leading-relaxed">"{motivation}"</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button 
                      onClick={() => handleSaveNote(motivation, 'daily-motivation', 'motivation')}
                      className={`text-xs text-gray-500 ${currentTheme.hoverText} flex items-center gap-1 transition-colors`}
                    >
                      <Bookmark className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={generateMotivation}
                  variant="secondary"
                  className="w-full justify-center mt-2 bg-gray-800/50 hover:bg-gray-800 border-gray-700"
                >
                  <Sparkles className={`w-4 h-4 mr-2 ${currentTheme.text}`} />
                  Get motivation from {PERSONA_DEFINITIONS[coachPersona].name}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Insights Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider">Your Insights</h3>
            <button 
              onClick={generateInsights}
              disabled={loading.insights}
              className="text-xs text-emerald-400 flex items-center gap-1 hover:text-emerald-300"
            >
              <RefreshCw className={`w-3 h-3 ${loading.insights ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {loading.insights ? (
            <Card hover={false} className="p-6">
              <div className="flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-gray-400 text-sm">Analyzing your progress...</span>
              </div>
            </Card>
          ) : insights ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <Card hover={false} className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-200 font-sans">{insights.summary}</p>
                  </div>
                </div>
              </Card>
              
              <div className="grid grid-cols-2 gap-3">
                <Card hover={false} className="p-4">
                  <Award className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-1">Strength</p>
                  <p className="text-sm text-gray-300 font-sans">{insights.strength}</p>
                </Card>
                <Card hover={false} className="p-4">
                  <Target className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-1">Focus Area</p>
                  <p className="text-sm text-gray-300 font-sans">{insights.improvement}</p>
                </Card>
              </div>
              
              <Card hover={false} className="p-4 border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Star className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 font-medium">Next Goal</p>
                    <p className="text-sm text-gray-200 font-sans">{insights.nextGoal}</p>
                  </div>
                </div>
              </Card>
              {errors.insights && (
                <ErrorMessage error={errors.insights} onRetry={generateInsights} />
              )}
            </div>
          ) : (
            <Card hover={false} className="p-6 text-center">
              <Brain className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {workouts.length === 0 
                  ? "Complete your first workout to unlock insights!"
                  : "Tap refresh to generate your personalized insights"}
              </p>
            </Card>
          )}
        </div>

        {/* Tips Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider">Pro Tips</h3>
            <button 
              onClick={generateTips}
              disabled={loading.tips}
              className="text-xs text-emerald-400 flex items-center gap-1 hover:text-emerald-300"
            >
              {tips.length > 0 ? (
                <>
                  <RefreshCw className={`w-3 h-3 ${loading.tips ? 'animate-spin' : ''}`} />
                  New Tips
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Generate Tips
                </>
              )}
            </button>
          </div>
          
          {loading.tips ? (
            <Card hover={false} className="p-6">
              <div className="flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-gray-400 text-sm">Creating personalized tips...</span>
              </div>
            </Card>
          ) : tips.length > 0 ? (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
              {tips.map((tip, i) => {
                const Icon = getTipIcon(tip.icon);
                return (
                  <Card key={i} hover={false} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{tip.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tip.tip}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {errors.tips && (
                <ErrorMessage error={errors.tips} onRetry={generateTips} />
              )}
            </div>
          ) : (
            <Card hover={false} className="p-6 text-center">
              <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Tap "Generate Tips" for personalized advice</p>
            </Card>
          )}
        </div>

        {/* Task 2: Saved Notes Section */}
        {notes && notes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Saved Notes ({notes.length})
              </h3>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                {showNotes ? 'Hide' : 'Show All'}
              </button>
            </div>

            {showNotes && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                {/* Search & Filter */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search notes..."
                      icon={Search}
                      value={notesSearchQuery}
                      onChange={(e) => setNotesSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    value={notesCategoryFilter || ''}
                    onChange={(e) => setNotesCategoryFilter(e.target.value || null)}
                    className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="">All</option>
                    <option value="chat">Chat</option>
                    <option value="tip">Tips</option>
                    <option value="insight">Insights</option>
                    <option value="motivation">Motivation</option>
                  </select>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredNotes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No notes found</p>
                  ) : (
                    filteredNotes.map((note) => {
                      const isExpanded = expandedNoteId === note.id;
                      return (
                        <Card 
                          key={note.id} 
                          hover={false} 
                          className="p-3 group cursor-pointer transition-all"
                          onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm text-gray-200 ${isExpanded ? '' : 'line-clamp-3'}`}>
                                {note.text}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-500 capitalize">
                                  {note.category}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                  {note.createdAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                {note.text.length > 100 && (
                                  <span className="text-[10px] text-emerald-500/50 ml-auto">
                                    {isExpanded ? 'Show less' : 'Read more'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {onDeleteNote && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNote(note.id);
                                }}
                                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deep Analysis Modal */}
        <DeepAnalysisModal 
          isOpen={showDeepAnalysis} 
          onClose={() => setShowDeepAnalysis(false)} 
          persona={PERSONA_DEFINITIONS[coachPersona]}
          workouts={workouts}
        />

        {/* Chat Overlay */}
        <AIChatOverlay
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleChat}
          loading={chatLoading}
          persona={PERSONA_DEFINITIONS[coachPersona]}
          theme={currentTheme}
          suggestedPrompts={suggestedPrompts}
          onSaveNote={handleSaveNote}
          savedMessageIds={savedMessageIds}
          PersonaIcon={PERSONA_ICONS[coachPersona]}
          onSavePlan={handleSavePlan}
          onStartPlan={onStartWorkout}
        />

        {/* Floating Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className={`fixed bottom-24 right-4 z-40 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${currentTheme.bg} text-gray-950`}
        >
          <MessageCircle className="w-6 h-6" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-950" />
          )}
        </button>
      </div>
    </div>
  );
}


export default BuddyView;
