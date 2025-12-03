import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useExerciseTips');

// Cache key prefix
const CACHE_PREFIX = 'exercise-tips-';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Hook for managing AI-generated exercise form tips
 * Task 9: Auto-Generated Form Tips
 */
export function useExerciseTips(apiKey) {
  const [loading, setLoading] = useState(false);
  const [tipsCache, setTipsCache] = useState({});

  // Load cached tips from localStorage on mount
  useEffect(() => {
    try {
      const cachedTips = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          const data = JSON.parse(localStorage.getItem(key));
          // Check if cache is still valid
          if (data && data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
            const exerciseName = key.replace(CACHE_PREFIX, '');
            cachedTips[exerciseName] = data.tips;
          } else {
            // Remove expired cache
            localStorage.removeItem(key);
          }
        }
      }
      setTipsCache(cachedTips);
    } catch (err) {
      log.error('Error loading cached tips:', err);
    }
  }, []);

  // Get tips from cache or generate new ones
  const getTips = useCallback(async (exerciseName, experienceLevel = 'intermediate') => {
    if (!exerciseName) return null;

    const normalizedName = exerciseName.toLowerCase().trim();
    const cacheKey = `${normalizedName}-${experienceLevel}`;

    // Check in-memory cache first
    if (tipsCache[cacheKey]) {
      return tipsCache[cacheKey];
    }

    // Check localStorage cache
    try {
      const localStorageKey = `${CACHE_PREFIX}${cacheKey}`;
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data && data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
          setTipsCache(prev => ({ ...prev, [cacheKey]: data.tips }));
          return data.tips;
        }
      }
    } catch (err) {
      log.error('Error reading cache:', err);
    }

    // If no API key, return null
    if (!apiKey) {
      return null;
    }

    // Generate new tips
    setLoading(true);
    try {
      const tips = await generateTips(exerciseName, experienceLevel);
      
      // Save to cache
      const localStorageKey = `${CACHE_PREFIX}${cacheKey}`;
      localStorage.setItem(localStorageKey, JSON.stringify({
        tips,
        timestamp: Date.now()
      }));
      
      setTipsCache(prev => ({ ...prev, [cacheKey]: tips }));
      return tips;
    } catch (err) {
      log.error('Error generating tips:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey, tipsCache]);

  // Generate tips from AI
  const generateTips = async (exerciseName, experienceLevel) => {
    const prompt = `Generate form tips for the exercise "${exerciseName}" for a ${experienceLevel} lifter.

Return ONLY valid JSON with this structure:
{
  "formDescription": "2-3 sentences describing proper form and setup",
  "keyCues": ["Quick cue 1", "Quick cue 2", "Quick cue 3"],
  "commonMistakes": ["Mistake 1 and how to fix it", "Mistake 2 and how to fix it"]
}

Be specific, actionable, and appropriate for ${experienceLevel} level.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate tips');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from AI');
    }

    // Clean and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedText);
  };

  // Prefetch tips for a list of exercises
  const prefetchTips = useCallback(async (exercises, experienceLevel = 'intermediate') => {
    if (!apiKey || !exercises || exercises.length === 0) return;

    // Only prefetch exercises not already cached
    const uncached = exercises.filter(ex => {
      const cacheKey = `${ex.toLowerCase().trim()}-${experienceLevel}`;
      return !tipsCache[cacheKey];
    });

    // Prefetch in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < Math.min(uncached.length, 9); i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      await Promise.all(batch.map(ex => getTips(ex, experienceLevel)));
      // Small delay between batches
      if (i + batchSize < uncached.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [apiKey, getTips, tipsCache]);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      setTipsCache({});
    } catch (err) {
      log.error('Error clearing cache:', err);
    }
  }, []);

  return {
    getTips,
    prefetchTips,
    clearCache,
    loading,
    cacheSize: Object.keys(tipsCache).length
  };
}
