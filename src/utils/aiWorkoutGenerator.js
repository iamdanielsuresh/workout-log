/**
 * AI Workout Generator - Enhanced prompt building for personalized workout plans
 * 
 * Uses user context, workout history, and preferences to generate
 * more relevant and personalized workout routines.
 */

import { buildUserContextForAI } from './aiContext';

/**
 * Calculate intensity score from a workout plan
 * @param {Object} plan - A single workout plan
 * @returns {Object} Intensity analysis
 */
export function calculatePlanIntensity(plan) {
  if (!plan?.exercises || plan.exercises.length === 0) {
    return { score: 0, level: 'Unknown', breakdown: {} };
  }

  let totalVolume = 0;
  let compoundCount = 0;
  let isolationCount = 0;

  const compoundKeywords = [
    'squat', 'deadlift', 'bench', 'press', 'row', 'pull-up', 'pullup',
    'chin-up', 'chinup', 'dip', 'lunge', 'clean', 'snatch', 'thruster'
  ];

  plan.exercises.forEach(ex => {
    const sets = ex.sets || 3;
    const reps = parseReps(ex.range || ex.reps || '8-12');
    totalVolume += sets * reps;

    // Check if compound
    const name = (ex.name || '').toLowerCase();
    const isCompound = compoundKeywords.some(k => name.includes(k));
    if (isCompound) {
      compoundCount++;
    } else {
      isolationCount++;
    }
  });

  // Calculate intensity score (0-100)
  const exerciseCount = plan.exercises.length;
  const avgSets = plan.exercises.reduce((sum, e) => sum + (e.sets || 3), 0) / exerciseCount;
  const compoundRatio = compoundCount / exerciseCount;

  // Score factors:
  // - Exercise count (4-8 optimal)
  // - Average sets (3-5 optimal)
  // - Compound ratio (higher = more intense)
  // - Total volume
  let score = 0;
  score += Math.min(exerciseCount * 8, 40); // Up to 40 points
  score += Math.min(avgSets * 8, 32);       // Up to 32 points
  score += compoundRatio * 28;              // Up to 28 points

  // Determine level
  let level;
  if (score < 35) level = 'Low';
  else if (score < 55) level = 'Moderate';
  else if (score < 75) level = 'High';
  else level = 'Very High';

  return {
    score: Math.round(score),
    level,
    breakdown: {
      exerciseCount,
      totalVolume,
      avgSets: Math.round(avgSets * 10) / 10,
      compoundCount,
      isolationCount,
      compoundRatio: Math.round(compoundRatio * 100)
    }
  };
}

/**
 * Parse rep range to get average reps
 * @param {string|number} range - Rep range like "8-12" or number
 * @returns {number} Average reps
 */
function parseReps(range) {
  if (typeof range === 'number') return range;
  const match = String(range).match(/(\d+)-(\d+)/);
  if (match) {
    return (parseInt(match[1]) + parseInt(match[2])) / 2;
  }
  const single = parseInt(range);
  return isNaN(single) ? 10 : single;
}

/**
 * Build an enhanced AI prompt for workout generation
 * 
 * @param {Object} options
 * @param {number} options.daysPerWeek - Training days per week
 * @param {string} options.focus - Training focus (balanced, strength, hypertrophy, etc.)
 * @param {string} options.duration - Session duration range
 * @param {string} options.equipment - Available equipment
 * @param {string} options.specialNotes - User's special notes (injuries, preferences, etc.)
 * @param {Object} options.userContext - User context from buildUserContextForAI
 * @returns {string} Enhanced prompt for AI
 */
export function buildWorkoutGenerationPrompt({
  daysPerWeek,
  focus,
  duration,
  equipment = 'full',
  specialNotes = '',
  userContext = null
}) {
  // Base requirements
  const requirements = [
    `Days per week: ${daysPerWeek}`,
    `Focus: ${focus}`,
    `Session duration: ${duration} minutes`,
    `Equipment: ${equipment === 'full' ? 'Full gym' : equipment === 'minimal' ? 'Minimal (dumbbells, bands)' : 'Bodyweight only'}`
  ];

  // Add special notes section if provided
  let specialNotesSection = '';
  if (specialNotes && specialNotes.trim()) {
    specialNotesSection = `

USER SPECIAL NOTES (IMPORTANT - must strictly accommodate these):
${specialNotes.trim()}
`;
  }

  // Add user context if available
  let userContextSection = '';
  if (userContext) {
    // Destructure from the new flat context structure
    const { 
      experienceLevel, 
      totalWorkouts, 
      avgSessionDuration, 
      avgExercisesPerSession, 
      muscleGroupDistribution,
      weakAreas,
      strengthTrends,
      weeklyVolume
    } = userContext;
    
    // Format strength trends for the prompt
    let trendsInfo = '';
    if (strengthTrends && Object.keys(strengthTrends).length > 0) {
      const topTrends = Object.entries(strengthTrends)
        .slice(0, 3)
        .map(([exercise, data]) => `${exercise}: ${data.improvement > 0 ? '+' : ''}${data.improvement}% (1RM: ${data.current1RM}kg)`);
      trendsInfo = `\nSTRENGTH TRENDS:\n${topTrends.map(t => `- ${t}`).join('\n')}`;
    }

    // Format volume info
    let volumeInfo = '';
    if (weeklyVolume && Object.keys(weeklyVolume).length > 0) {
      const topVolume = Object.entries(weeklyVolume)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([group, sets]) => `${group}: ${sets} sets/week`);
      volumeInfo = `\nCURRENT VOLUME:\n${topVolume.map(v => `- ${v}`).join('\n')}`;
    }
    
    userContextSection = `
USER PROFILE:
- Experience: ${experienceLevel || 'intermediate'}
- Training history: ${totalWorkouts || 0} total workouts

RECENT PATTERNS:
- Avg exercises per workout: ${avgExercisesPerSession || 'N/A'}
- Avg session duration: ${avgSessionDuration || 'N/A'} minutes
- Most trained: ${getMostTrained(muscleGroupDistribution)}
${trendsInfo}${volumeInfo}

AREAS TO IMPROVE:
${weakAreas?.map(a => `- ${a}`).join('\n') || '- None identified'}

Based on this profile, create a plan that:
1. Addresses any weak areas identified
2. Maintains strengths shown in trends
3. Is appropriate for their experience level
`;
  }

  const prompt = `You are an expert fitness coach. Create a ${daysPerWeek}-day workout program.

REQUIREMENTS:
${requirements.map(r => `- ${r}`).join('\n')}
${specialNotesSection}${userContextSection}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no comments, no extra text
2. Each exercise needs detailed tips for proper form
3. Include rest periods appropriate for the focus (strength: 2-3 min, hypertrophy: 60-90 sec)
4. Balance muscle groups throughout the week
5. Start with compound movements, end with isolation
6. Consider recovery - don't hit same muscles on consecutive days
7. CRITICAL: If user mentioned injuries, limitations, or exercise preferences in special notes, strictly follow them

Return this exact JSON structure:
{
  "plans": {
    "day1": {
      "id": "day1",
      "name": "Descriptive Day Name",
      "next": "day2",
      "estTime": "${duration} min",
      "desc": "Target muscles and focus",
      "focus": "${focus}",
      "dayTip": "Motivational or practical tip for this day",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "range": "8-12",
          "restPeriod": "90 sec",
          "muscleGroup": "Primary muscle",
          "tip": "Quick form tip",
          "tips": {
            "form": "Detailed form instructions",
            "cues": ["Mental cue 1", "Mental cue 2"],
            "mistakes": ["Common mistake to avoid"],
            "goal": "What this exercise targets",
            "progression": "How to progress over time"
          }
        }
      ]
    }
  },
  "programName": "Program Name",
  "programDescription": "Brief overview of the program",
  "weeklyVolume": "Total sets per week estimate"
}

Create exactly ${daysPerWeek} days. Last day's "next" should point to "day1".
Include 4-6 exercises per day, appropriate for ${userContext?.profile?.experienceLevel || 'intermediate'} level.`;

  return prompt;
}

/**
 * Get most trained muscle group from distribution
 * @param {Object} distribution - Muscle group distribution object
 * @returns {string} Most trained areas
 */
function getMostTrained(distribution) {
  if (!distribution || Object.keys(distribution).length === 0) {
    return 'Not enough data';
  }
  
  const sorted = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([group]) => group);
  
  return sorted.join(', ') || 'Mixed';
}

/**
 * Validate AI-generated workout plan JSON
 * @param {Object} data - Parsed JSON from AI
 * @returns {Object} { valid: boolean, error: string|null, cleaned: Object|null }
 */
export function validateGeneratedPlan(data) {
  // Check for plans object
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format', cleaned: null };
  }

  if (!data.plans || typeof data.plans !== 'object') {
    return { valid: false, error: 'Missing plans object', cleaned: null };
  }

  const planKeys = Object.keys(data.plans);
  if (planKeys.length === 0) {
    return { valid: false, error: 'No workout days generated', cleaned: null };
  }

  // Validate each plan
  const cleanedPlans = {};
  const errors = [];

  planKeys.forEach(key => {
    const plan = data.plans[key];
    
    if (!plan.name) {
      errors.push(`Day ${key} missing name`);
    }
    
    if (!plan.exercises || !Array.isArray(plan.exercises)) {
      errors.push(`Day ${key} missing exercises array`);
      return;
    }

    if (plan.exercises.length === 0) {
      errors.push(`Day ${key} has no exercises`);
      return;
    }

    // Clean and validate exercises
    const cleanedExercises = plan.exercises
      .filter(ex => ex && ex.name)
      .map(ex => ({
        name: ex.name,
        sets: ex.sets || 3,
        range: ex.range || ex.reps || '8-12',
        restPeriod: ex.restPeriod || '90 sec',
        muscleGroup: ex.muscleGroup || 'General',
        tip: ex.tip || '',
        tips: ex.tips || {
          form: ex.tip || 'Focus on controlled movement',
          cues: [],
          mistakes: [],
          goal: '',
          progression: ''
        }
      }));

    if (cleanedExercises.length === 0) {
      errors.push(`Day ${key} has no valid exercises`);
      return;
    }

    cleanedPlans[key] = {
      id: key,
      name: plan.name || `Day ${key}`,
      desc: plan.desc || plan.description || '',
      next: plan.next || getNextDayKey(key, planKeys),
      estTime: plan.estTime || '45-60 min',
      focus: plan.focus || 'balanced',
      dayTip: plan.dayTip || '',
      exercises: cleanedExercises
    };
  });

  if (Object.keys(cleanedPlans).length === 0) {
    return { 
      valid: false, 
      error: errors.length > 0 ? errors.join('; ') : 'No valid workout days', 
      cleaned: null 
    };
  }

  // Return with warnings if some plans had issues
  return {
    valid: true,
    error: errors.length > 0 ? `Generated with warnings: ${errors.join('; ')}` : null,
    cleaned: {
      ...data,
      plans: cleanedPlans
    }
  };
}

/**
 * Get next day key in sequence
 * @param {string} currentKey - Current day key
 * @param {string[]} allKeys - All day keys
 * @returns {string} Next day key
 */
function getNextDayKey(currentKey, allKeys) {
  const currentIndex = allKeys.indexOf(currentKey);
  if (currentIndex === -1 || currentIndex === allKeys.length - 1) {
    return allKeys[0]; // Loop back to first
  }
  return allKeys[currentIndex + 1];
}

/**
 * Generate workout plan using AI
 * 
 * @param {string} apiKey - Google AI API key
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated plan or error
 */
export async function generateWorkoutPlan(apiKey, options) {
  const prompt = buildWorkoutGenerationPrompt(options);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 8192 
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Clean and parse JSON
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate and clean
    const validation = validateGeneratedPlan(parsed);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Add intensity calculations to each plan
    const plansWithIntensity = {};
    Object.entries(validation.cleaned.plans).forEach(([key, plan]) => {
      plansWithIntensity[key] = {
        ...plan,
        intensity: calculatePlanIntensity(plan)
      };
    });

    return {
      success: true,
      data: {
        ...validation.cleaned,
        plans: plansWithIntensity
      },
      warning: validation.error // Will be null or contain warnings
    };

  } catch (error) {
    console.error('AI workout generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate workout plan',
      data: null
    };
  }
}

/**
 * Get focus-specific recommendations
 * @param {string} focus - Training focus
 * @returns {Object} Recommendations for the focus
 */
export function getFocusRecommendations(focus) {
  const recommendations = {
    balanced: {
      repRange: '8-12',
      restPeriod: '60-90 sec',
      description: 'Mix of strength and muscle building',
      tips: ['Include both compound and isolation exercises', 'Vary rep ranges through the week']
    },
    strength: {
      repRange: '3-6',
      restPeriod: '2-3 min',
      description: 'Heavy weights, lower reps, full recovery',
      tips: ['Focus on progressive overload', 'Prioritize compound movements', 'Quality over quantity']
    },
    hypertrophy: {
      repRange: '8-15',
      restPeriod: '60-90 sec',
      description: 'Moderate weight, higher volume for muscle growth',
      tips: ['Focus on time under tension', 'Include drop sets and supersets', 'Ensure adequate protein intake']
    },
    'upper body': {
      repRange: '8-12',
      restPeriod: '60-90 sec',
      description: 'Chest, back, shoulders, and arms focus',
      tips: ['Balance push and pull movements', 'Don\'t neglect rear delts', 'Include both horizontal and vertical pulling']
    },
    'lower body': {
      repRange: '8-15',
      restPeriod: '90-120 sec',
      description: 'Legs, glutes, and core focus',
      tips: ['Start with compounds like squats', 'Include unilateral work', 'Don\'t skip calves and hamstrings']
    }
  };

  return recommendations[focus] || recommendations.balanced;
}
