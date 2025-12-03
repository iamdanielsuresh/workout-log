import { useState, useCallback } from 'react';
import * as aiService from '../services/ai';

/**
 * Hook for AI coaching interactions
 */
export function useAI(apiKey, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAvailable = enabled && !!apiKey;

  // Get exercise tip
  const getTip = useCallback(async (exerciseName, lastWeight, userName) => {
    if (!isAvailable) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const tip = await aiService.getExerciseTip(apiKey, exerciseName, lastWeight, userName);
      return tip;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey, isAvailable]);

  // Analyze workout patterns
  const analyzePatterns = useCallback(async (workoutHistory, userName) => {
    if (!isAvailable) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await aiService.analyzeWorkoutPatterns(apiKey, workoutHistory, userName);
      return analysis;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey, isAvailable]);

  // Get motivation message
  const getMotivation = useCallback(async (context) => {
    if (!isAvailable) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const motivation = await aiService.getMotivation(apiKey, context);
      return motivation;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey, isAvailable]);

  // Suggest weight
  const suggestWeight = useCallback(async (exerciseName, exerciseHistory, targetReps) => {
    if (!isAvailable) return null;
    
    try {
      const suggestion = await aiService.suggestWeight(apiKey, exerciseName, exerciseHistory, targetReps);
      return suggestion;
    } catch {
      return null;
    }
  }, [apiKey, isAvailable]);

  // Generate workout summary
  const generateSummary = useCallback(async (workout, userName) => {
    if (!isAvailable) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const summary = await aiService.generateWorkoutSummary(apiKey, workout, userName);
      return summary;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey, isAvailable]);

  return {
    isAvailable,
    loading,
    error,
    getTip,
    analyzePatterns,
    getMotivation,
    suggestWeight,
    generateSummary,
  };
}
