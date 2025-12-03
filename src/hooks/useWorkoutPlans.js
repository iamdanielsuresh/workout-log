import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { DEFAULT_WORKOUT_PLANS } from '../constants/defaults';
import { createLogger } from '../utils/logger';

const log = createLogger('useWorkoutPlans');

/**
 * Hook for managing user's workout plans
 */
export function useWorkoutPlans(userId) {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch plans when userId changes
  useEffect(() => {
    if (!userId) {
      setPlans(null);
      setLoading(false);
      return;
    }

    const fetchPlans = async () => {
      log.log('Fetching plans for user:', userId);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }
        
        if (data && data.length > 0) {
          log.log('Fetched plans:', data);
          // Convert array to object keyed by plan_id
          const plansObj = {};
          data.forEach(plan => {
            plansObj[plan.plan_id] = {
              id: plan.plan_id,
              name: plan.name,
              desc: plan.description,
              next: plan.next_plan,
              estTime: plan.est_time,
              exercises: plan.exercises || [],
              source: plan.source,
              dbId: plan.id
            };
          });
          setPlans(plansObj);
        } else {
          log.log('No plans found');
          setPlans(null);
        }
      } catch (err) {
        log.error('Error fetching workout plans:', err);
        setError(err.message || 'Failed to load workout plans');
        setPlans(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [userId]);

  // Save multiple plans at once (used during onboarding)
  const savePlans = useCallback(async (plansData, source = 'template', templateId = null) => {
    if (!userId) {
      log.error('Cannot save - no user ID');
      throw new Error('No user ID available');
    }

    log.log('Saving plans for user:', userId, plansData);

    // Convert plans object to array for insertion
    const plansArray = Object.entries(plansData).map(([planId, plan], index) => ({
      user_id: userId,
      plan_id: planId,
      name: plan.name,
      description: plan.desc || plan.description || '',
      next_plan: plan.next,
      est_time: plan.estTime || plan.est_time || '45 min',
      exercises: plan.exercises || [],
      source,
      template_id: templateId,
      sort_order: index,
      is_active: true
    }));

    // Delete existing plans first
    const { error: deleteError } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      log.error('Error deleting existing plans:', deleteError);
    }

    // Insert new plans
    const { data, error } = await supabase
      .from('workout_plans')
      .insert(plansArray)
      .select();

    if (error) {
      log.error('Error saving workout plans:', error);
      throw error;
    }

    log.log('Plans saved successfully:', data);

    // Update local state
    const plansObj = {};
    data.forEach(plan => {
      plansObj[plan.plan_id] = {
        id: plan.plan_id,
        name: plan.name,
        desc: plan.description,
        next: plan.next_plan,
        estTime: plan.est_time,
        exercises: plan.exercises || [],
        source: plan.source,
        dbId: plan.id
      };
    });
    setPlans(plansObj);
    
    return data;
  }, [userId]);

  // Update a single plan
  const updatePlan = useCallback(async (planId, updates) => {
    if (!userId || !plans?.[planId]) {
      throw new Error('Plan not found');
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .update({
        name: updates.name,
        description: updates.desc,
        exercises: updates.exercises,
        est_time: updates.estTime,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .select()
      .single();

    if (error) {
      log.error('Error updating plan:', error);
      throw error;
    }

    setPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        ...updates
      }
    }));

    return data;
  }, [userId, plans]);

  // Delete a plan
  const deletePlan = useCallback(async (planId) => {
    if (!userId) return;

    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId)
      .eq('plan_id', planId);

    if (error) {
      log.error('Error deleting plan:', error);
      throw error;
    }

    setPlans(prev => {
      const newPlans = { ...prev };
      delete newPlans[planId];
      return Object.keys(newPlans).length > 0 ? newPlans : null;
    });
  }, [userId]);

  // Get active plans (with fallback to defaults)
  const activePlans = plans || DEFAULT_WORKOUT_PLANS;
  const hasCustomPlans = !!plans;
  const plansList = Object.values(activePlans);

  return {
    plans: activePlans,
    rawPlans: plans,
    loading,
    error,
    savePlans,
    updatePlan,
    deletePlan,
    hasCustomPlans,
    plansList,
    clearError: () => setError(null),
  };
}
