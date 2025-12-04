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
  buildTipsPrompt
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
  onNavigate 
}) {
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
  const chatEndRef = useRef(null);

  // Persona definitions
  const PERSONAS = {
    supportive: {
      name: 'Buddy',
      icon: Sparkles,
      prompt: "You're a knowledgeable, friendly gym buddy AI assistant. Be encouraging, practical, and reference their data when relevant."
    },
    sergeant: {
      name: 'Drill Sgt',
      icon: Flame,
      prompt: "You are a tough, no-nonsense drill sergeant. Push the user hard, use tough love, demand discipline, and don't accept excuses."
    },
    scientist: {
      name: 'Prof. Lift',
      icon: Brain,
      prompt: "You are a sports scientist. Focus on biomechanics, physiology, and data. Be precise, analytical, and cite principles of hypertrophy/strength."
    },
    stoic: {
      name: 'Mentor',
      icon: Award,
      prompt: "You are a stoic mentor. Focus on discipline, consistency, and mental fortitude. Keep responses brief, wise, and focused on the long game."
    }
  };

  const QUICK_PROMPTS = [
    "Analyze my week",
    "Why am I sore?",
    "Suggest a warm-up",
    "Give me a challenge"
  ];

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

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const generateInsights = async () => {
    if (!aiAvailability.available) return;
    setLoading(prev => ({ ...prev, insights: true }));
    clearError('insights');
    
    try {
      const prompt = buildInsightsPrompt(userContext);
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
      const prompt = buildMotivationPrompt(userContext);
      const response = await makeAIRequest(apiKey, prompt);
      setMotivation(response);
    } catch (error) {
      console.error('Error generating motivation:', error);
      setErrors(prev => ({ ...prev, motivation: error.message || 'Failed to get motivation' }));
      // Contextual fallback
      if (streak > 0) {
        setMotivation(`${streak} days strong! Your consistency is building something amazing. Keep pushing!`);
      } else if (workouts.length > 0) {
        setMotivation(`You've got ${workouts.length} workouts under your belt. Today's a great day to add another!`);
      } else {
        setMotivation("Every champion was once a beginner. Today is your day to start!");
      }
    } finally {
      setLoading(prev => ({ ...prev, motivation: false }));
    }
  };

  const generateTips = async () => {
    if (!aiAvailability.available) return;
    setLoading(prev => ({ ...prev, tips: true }));
    clearError('tips');
    
    try {
      const prompt = buildTipsPrompt(userContext);
      const response = await makeAIRequest(apiKey, prompt);
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      setTips(JSON.parse(cleaned));
    } catch (error) {
      console.error('Error generating tips:', error);
      setErrors(prev => ({ ...prev, tips: error.message || 'Failed to generate tips' }));
      // Contextual fallback tips
      const fallbackTips = [
        { title: "Perfect Your Form", tip: "Quality reps beat quantity. Focus on controlled movements.", icon: "form" },
        { title: "Fuel Your Gains", tip: "Protein within 30 mins post-workout maximizes muscle growth.", icon: "nutrition" },
        { title: "Rest & Recover", tip: "Muscles grow during rest. Get 7-8 hours of sleep.", icon: "recovery" }
      ];
      
      // Customize based on context
      if (userContext.last7DaysWorkouts >= 5) {
        fallbackTips[2] = { 
          title: "Recovery Day", 
          tip: "With your high frequency, consider an active recovery day.", 
          icon: "recovery" 
        };
      }
      
      setTips(fallbackTips);
    } finally {
      setLoading(prev => ({ ...prev, tips: false }));
    }
  };

  const handleChat = async (messageOverride = null) => {
    const messageToSend = messageOverride || chatInput.trim();
    if (!messageToSend || !aiAvailability.available || chatLoading) return;
    
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setChatLoading(true);
    
    try {
      const contextStr = formatContextForPrompt(userContext);
      const personaPrompt = PERSONAS[coachPersona].prompt;
      
      const prompt = `${personaPrompt}

User Context:
${contextStr}

User asks: "${messageToSend}"

Give a helpful, concise response (under 60 words).`;
      
      const response = await makeAIRequest(apiKey, prompt);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response, id: `msg-${Date.now()}` }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I couldn't process that right now. Try again in a moment!",
        id: `msg-${Date.now()}`
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

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ViewHeader 
        title="AI Buddy" 
        subtitle="Your personal coach"
        rightAction={
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats - using centralized stats utility */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold text-gray-100">{workoutStats.currentStreak}</p>
            <p className="text-[10px] text-gray-500">Streak</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/20">
            <Dumbbell className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold text-gray-100">{workoutStats.totalWorkouts}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/20">
            <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold text-gray-100">{workoutStats.workoutsThisWeek}</p>
            <p className="text-[10px] text-gray-500">This Week</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/20">
            <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold text-gray-100">
              {workoutStats.averageDuration > 0 ? workoutStats.averageDuration : '--'}
            </p>
            <p className="text-[10px] text-gray-500">Avg Min</p>
          </div>
        </div>

        {/* Strength Trends */}
        {userContext.strengthTrends && Object.keys(userContext.strengthTrends).length > 0 && (
          <div>
            <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider mb-3">Strength Trends</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(userContext.strengthTrends)
                .sort((a, b) => b[1].improvement - a[1].improvement)
                .slice(0, 4)
                .map(([exercise, trend]) => (
                  <Card key={exercise} hover={false} className="p-3 border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-gray-200 truncate capitalize">{exercise}</p>
                      <span className={`text-xs font-bold ${trend.improvement > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {trend.improvement > 0 ? '+' : ''}{trend.improvement}%
                      </span>
                    </div>
                    <div className="flex items-end gap-1">
                      <p className="text-lg font-display font-bold text-white">{trend.current1RM}</p>
                      <p className="text-xs text-gray-500 mb-1">kg (1RM)</p>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Motivation Card */}
        <Card 
          hover={false} 
          className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl flex-shrink-0">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg text-gray-100 mb-2 tracking-tight">Daily Motivation</h3>
              {motivation ? (
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed animate-in fade-in font-sans whitespace-pre-line">{motivation}</p>
                  {errors.motivation && (
                    <ErrorMessage error={errors.motivation} onRetry={generateMotivation} />
                  )}
                </div>
              ) : (
                <button 
                  onClick={generateMotivation}
                  disabled={loading.motivation}
                  className="text-emerald-400 text-sm flex items-center gap-1 hover:text-emerald-300 transition-colors"
                >
                  {loading.motivation ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get today's motivation
                    </>
                  )}
                </button>
              )}
            </div>
            {motivation && (
              <button 
                onClick={generateMotivation}
                disabled={loading.motivation}
                className="p-2 text-gray-500 hover:text-emerald-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.motivation ? 'animate-spin' : ''}`} />
              </button>
            )}
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

        {/* Chat Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider">Ask Your Buddy</h3>
            
            {/* Persona Selector */}
            <div className="flex gap-1">
              {Object.entries(PERSONAS).map(([key, persona]) => {
                const Icon = persona.icon;
                const isActive = coachPersona === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCoachPersona(key)}
                    className={`p-1.5 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/20' 
                        : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                    title={persona.name}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <Card hover={false} className="overflow-hidden flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    {(() => {
                      const Icon = PERSONAS[coachPersona].icon;
                      return <Icon className="w-6 h-6 text-emerald-400" />;
                    })()}
                  </div>
                  <p className="text-gray-300 font-medium mb-1">
                    {PERSONAS[coachPersona].name} is ready!
                  </p>
                  <p className="text-gray-500 text-xs max-w-[200px]">
                    {coachPersona === 'sergeant' ? "Ready to sweat, recruit?" : 
                     coachPersona === 'scientist' ? "Let's analyze the data." :
                     coachPersona === 'stoic' ? "Discipline equals freedom." :
                     "Ask anything about fitness!"}
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, i) => {
                    const isSaved = msg.id && savedMessageIds.has(msg.id);
                    return (
                      <div
                        key={msg.id || i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 group`}
                      >
                        <div className={`max-w-[80%] ${msg.role === 'assistant' ? 'relative' : ''}`}>
                          <div className={`p-3 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-emerald-500 text-gray-950 rounded-br-md'
                              : 'bg-gray-800 text-gray-200 rounded-bl-md'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          {/* Task 2: Save Note button for AI messages */}
                          {msg.role === 'assistant' && onSaveNote && (
                            <button
                              onClick={() => handleSaveNote(msg.content, msg.id, 'chat')}
                              disabled={isSaved}
                              className={`absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                                isSaved 
                                  ? 'text-emerald-400 bg-emerald-500/10' 
                                  : 'text-gray-500 hover:text-emerald-400 hover:bg-gray-700 opacity-0 group-hover:opacity-100'
                              }`}
                              title={isSaved ? 'Saved!' : 'Save as note'}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-4 h-4" />
                              ) : (
                                <Bookmark className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i} 
                              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleChat(prompt)}
                    disabled={chatLoading}
                    className="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gray-900/50 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder={`Ask ${PERSONAS[coachPersona].name}...`}
                  className="flex-1 bg-gray-800 border-transparent focus:border-emerald-500/50 focus:ring-0 rounded-xl text-sm text-gray-100 placeholder-gray-500 px-4 py-3"
                  disabled={chatLoading}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleChat()} 
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default BuddyView;
